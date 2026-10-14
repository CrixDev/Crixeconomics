import { getCountry } from '$lib/countries';
import type { TradePartner, TradeView } from '$lib/types';
import { cached, HOUR } from '../cache';
import { getJson } from '../http';

const BASE = 'https://comtradeapi.un.org';
const WEEK = 7 * 24 * HOUR;
const TOP = 8;

type RefResponse = {
	results: {
		PartnerCode: number;
		PartnerDesc: string;
		PartnerCodeIsoAlpha2?: string;
		isGroup: boolean;
	}[];
};
type DataResponse = {
	data?: { flowCode: 'X' | 'M'; partnerCode: number; primaryValue: number }[];
	error?: string;
};

const regionNames = new Intl.DisplayNames(['es'], { type: 'region' });

/** Comtrade reporta a Taiwán como "Other Asia, nes" (código 490). */
const OVERRIDES: Record<number, string> = { 490: 'TW' };

/** La API pública admite ~1 petición por segundo: se encolan. */
let queue: Promise<unknown> = Promise.resolve();
function throttled<T>(fn: () => Promise<T>): Promise<T> {
	const run = queue.then(fn, fn);
	const pause = () => new Promise((r) => setTimeout(r, 1100));
	queue = run.then(pause, pause);
	return run;
}

function partners(): Promise<Map<number, { iso2: string | null; name: string; group: boolean }>> {
	return cached('comtrade:partners', WEEK, async () => {
		const ref = await getJson<RefResponse>(`${BASE}/files/v1/app/reference/partnerAreas.json`);
		return new Map(
			ref.results.map((p) => {
				const code = OVERRIDES[p.PartnerCode] ?? p.PartnerCodeIsoAlpha2;
				const iso2 = code && /^[A-Z]{2}$/.test(code) ? code : null;
				let name = p.PartnerDesc.trim();
				if (iso2) {
					try {
						name = regionNames.of(iso2) ?? name;
					} catch {
						/* código sin nombre en ICU */
					}
				}
				return [p.PartnerCode, { iso2, name, group: p.isGroup }];
			})
		);
	});
}

async function fetchYear(m49: number, year: number): Promise<DataResponse['data']> {
	const params = new URLSearchParams({
		reporterCode: String(m49),
		period: String(year),
		flowCode: 'X,M',
		cmdCode: 'TOTAL',
		customsCode: 'C00',
		motCode: '0',
		partner2Code: '0'
	});
	const res = await throttled(() =>
		getJson<DataResponse>(`${BASE}/public/v1/preview/C/A/HS?${params}`, {
			timeoutMs: 30_000,
			retries: 3
		})
	);
	return res.data ?? [];
}

function top(
	rows: NonNullable<DataResponse['data']>,
	flow: 'X' | 'M',
	ref: Awaited<ReturnType<typeof partners>>
): { total: number; list: TradePartner[] } {
	const flowRows = rows.filter((r) => r.flowCode === flow);
	const world = flowRows.find((r) => r.partnerCode === 0)?.primaryValue;
	const list = flowRows
		// Fuera el total mundial, los agregados y las "áreas no especificadas" (sin código ISO).
		.filter(
			(r) => r.partnerCode !== 0 && ref.get(r.partnerCode)?.iso2 && !ref.get(r.partnerCode)?.group
		)
		.sort((a, b) => b.primaryValue - a.primaryValue);
	const total = world ?? list.reduce((s, r) => s + r.primaryValue, 0);
	return {
		total,
		list: list.slice(0, TOP).map((r) => {
			const p = ref.get(r.partnerCode);
			return {
				iso2: p?.iso2 ?? null,
				name: p?.name ?? `Código ${r.partnerCode}`,
				value: r.primaryValue,
				share: total ? r.primaryValue / total : 0
			};
		})
	};
}

/** Principales socios comerciales del año más reciente que el país reportó a Comtrade. */
export function getTrade(iso3: string): Promise<TradeView | null> {
	return cached(`comtrade:${iso3}`, WEEK, async () => {
		const country = getCountry(iso3);
		if (!country) return null;
		const [ref] = await Promise.all([partners()]);
		const currentYear = new Date().getFullYear();
		for (let year = currentYear - 1; year >= currentYear - 4; year--) {
			const rows = await fetchYear(country.m49, year);
			if (!rows?.length) continue;
			const x = top(rows, 'X', ref);
			const m = top(rows, 'M', ref);
			if (!x.list.length && !m.list.length) continue;
			return {
				year,
				exportsTotal: x.total,
				importsTotal: m.total,
				exports: x.list,
				imports: m.list
			};
		}
		return null;
	});
}
