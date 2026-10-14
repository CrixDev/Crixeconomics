import { COUNTRY_CODES } from '$lib/countries';
import { csvRecords } from '$lib/csv';
import type { Point } from '$lib/types';
import { cached, HOUR } from '../cache';
import { getText } from '../http';

const BASE = 'https://sdmx.ilo.org/rest/data/ILO';
// Sin Accept-Language explícito, undici manda "*" y el servidor de la OIT responde 500.
const ACCEPT = { accept: 'application/vnd.sdmx.data+csv;version=1.0.0', 'accept-language': 'en' };

// Salario mínimo: REF_AREA.FREQ.MEASURE.CUR · Salario mediano: REF_AREA.FREQ.MEASURE.SEX.CUR
const FLOWS = {
	INEE: { id: 'DF_EAR_INEE_CUR_NB', key: (areas: string) => `${areas}.A..` },
	EMTM: { id: 'DF_EAR_EMTM_SEX_CUR_NB', key: (areas: string) => `${areas}.A..SEX_T.` }
} as const;

type Cur = 'LCU' | 'USD' | 'PPP';

function load(flow: keyof typeof FLOWS): Promise<Record<Cur, Record<string, Point[]>>> {
	return cached(`ilo:${flow}`, 24 * HOUR, async () => {
		const { id, key } = FLOWS[flow];
		const csv = await getText(
			`${BASE},${id},1.0/${key(COUNTRY_CODES.join('+'))}?startPeriod=2000`,
			{ headers: ACCEPT, timeoutMs: 45_000, retries: 3 }
		);
		const out: Record<Cur, Record<string, Point[]>> = { LCU: {}, USD: {}, PPP: {} };
		for (const row of csvRecords(csv)) {
			const cur = row.CUR?.replace('CUR_TYPE_', '') as Cur;
			const value = Number.parseFloat(row.OBS_VALUE);
			if (!(cur in out) || !Number.isFinite(value)) continue;
			(out[cur][row.REF_AREA] ??= []).push({
				t: Number(row.TIME_PERIOD),
				label: row.TIME_PERIOD,
				value
			});
		}
		for (const byCountry of Object.values(out)) {
			for (const points of Object.values(byCountry)) points.sort((a, b) => a.t - b.t);
		}
		dropBreaks(out);
		return out;
	});
}

/**
 * ILOSTAT a veces mezcla registros administrativos con otra base temporal
 * (p. ej. Ecuador y Uruguay 2024 llegan como ≈ 1/12 del salario mensual). Un
 * salario en dólares PPA no puede caer a menos de un tercio ni triplicarse en
 * un año: esos años se descartan en las tres monedas.
 */
function dropBreaks(out: Record<Cur, Record<string, Point[]>>) {
	for (const iso3 of Object.keys(out.LCU)) {
		const reference = out.PPP[iso3] ?? out.USD[iso3];
		if (!reference) continue;
		const bad = new Set<number>();
		let prev: Point | undefined;
		for (const p of reference) {
			const ratio = prev ? p.value / prev.value : 1;
			if (prev && p.t - prev.t <= 2 && (ratio < 1 / 3 || ratio > 3)) bad.add(p.t);
			else prev = p;
		}
		if (!bad.size) continue;
		for (const cur of ['LCU', 'USD', 'PPP'] as const) {
			if (out[cur][iso3]) out[cur][iso3] = out[cur][iso3].filter((p) => !bad.has(p.t));
		}
	}
}

export async function getIlo(flow: keyof typeof FLOWS, cur: Cur): Promise<Record<string, Point[]>> {
	return (await load(flow))[cur];
}
