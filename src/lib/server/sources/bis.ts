import { COUNTRIES } from '$lib/countries';
import { csvRecords } from '$lib/csv';
import type { Point } from '$lib/types';
import { cached, HOUR } from '../cache';
import { getText } from '../http';

/** Países latinoamericanos con serie de precios de vivienda en el BIS. */
const COVERED = ['BR', 'CL', 'CO', 'MX', 'PE'];
const ISO3 = new Map(COUNTRIES.map((c) => [c.iso2, c.iso3]));

function load(): Promise<{ level: Record<string, Point[]>; yoy: Record<string, Point[]> }> {
	return cached('bis:spp', 24 * HOUR, async () => {
		// Q = trimestral, R = real (deflactado por IPC), 628 = índice 2010 = 100
		const csv = await getText(
			`https://stats.bis.org/api/v2/data/dataflow/BIS/WS_SPP/1.0/Q.${COVERED.join('+')}.R.628` +
				`?startPeriod=2005&format=csv`,
			{ timeoutMs: 30_000 }
		);
		const level: Record<string, Point[]> = {};
		for (const row of csvRecords(csv)) {
			const iso3 = ISO3.get(row.REF_AREA);
			const match = /^(\d{4})-Q(\d)$/.exec(row.TIME_PERIOD);
			const value = Number.parseFloat(row.OBS_VALUE);
			if (!iso3 || !match || !Number.isFinite(value)) continue;
			const [, year, q] = match;
			(level[iso3] ??= []).push({
				t: Number(year) + (Number(q) - 1) / 4,
				label: `${year}-T${q}`,
				value
			});
		}
		const yoy: Record<string, Point[]> = {};
		for (const [iso3, points] of Object.entries(level)) {
			points.sort((a, b) => a.t - b.t);
			const byT = new Map(points.map((p) => [p.t, p.value]));
			yoy[iso3] = points.flatMap((p) => {
				const prev = byT.get(p.t - 1);
				return prev ? [{ ...p, value: (p.value / prev - 1) * 100 }] : [];
			});
		}
		return { level, yoy };
	});
}

export async function getBis(transform: 'level' | 'yoy'): Promise<Record<string, Point[]>> {
	return (await load())[transform];
}
