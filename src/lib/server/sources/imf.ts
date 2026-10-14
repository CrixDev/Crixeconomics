import { COUNTRY_CODES } from '$lib/countries';
import type { Point } from '$lib/types';
import { cached, HOUR } from '../cache';
import { getJson } from '../http';

const BASE = 'https://www.imf.org/external/datamapper/api/v1';
const FIRST_YEAR = 1980;

type ImfResponse = { values?: Record<string, Record<string, Record<string, number>>> };

/**
 * DataMapper del FMI (World Economic Outlook y bases históricas). El WEO trae
 * proyecciones: se marcan como
 * `projected` los años a partir del año en curso.
 */
export function getImf(code: string, scale = 1): Promise<Record<string, Point[]>> {
	return cached(`imf:${code}`, 12 * HOUR, async () => {
		// La API ignora el filtro de países en la ruta; se pide todo y se filtra aquí.
		const json = await getJson<ImfResponse>(`${BASE}/${code}`, { timeoutMs: 30_000 });
		const values = json.values?.[code] ?? {};
		const currentYear = new Date().getFullYear();
		const out: Record<string, Point[]> = {};
		for (const iso3 of COUNTRY_CODES) {
			const byYear = values[iso3];
			if (!byYear) continue;
			out[iso3] = Object.entries(byYear)
				.filter(([year, v]) => typeof v === 'number' && Number(year) >= FIRST_YEAR)
				.map(([year, v]) => ({
					t: Number(year),
					label: year,
					value: v * scale,
					projected: Number(year) >= currentYear || undefined
				}))
				.sort((a, b) => a.t - b.t);
		}
		return out;
	});
}
