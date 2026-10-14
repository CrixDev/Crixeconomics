import { COUNTRY_CODES } from '$lib/countries';
import { csvRecords } from '$lib/csv';
import type { Point } from '$lib/types';
import { cached, HOUR } from '../cache';
import { getText } from '../http';

const LATAM = new Set(COUNTRY_CODES);

/**
 * Our World in Data publica cada gráfica como CSV. Lo usamos para series que
 * no tienen API propia abierta: IDH y escolaridad (PNUD), Índice de Percepción
 * de la Corrupción (Transparency International), felicidad (WHR) y WID.
 */
export function getOwid(slug: string, column: string): Promise<Record<string, Point[]>> {
	return cached(`owid:${slug}:${column}`, 24 * HOUR, async () => {
		const csv = await getText(
			`https://ourworldindata.org/grapher/${slug}.csv?v=1&csvType=full&useColumnShortNames=true`,
			{ timeoutMs: 30_000 }
		);
		const out: Record<string, Point[]> = {};
		for (const row of csvRecords(csv)) {
			if (!LATAM.has(row.code)) continue;
			const value = Number.parseFloat(row[column]);
			if (!Number.isFinite(value)) continue;
			(out[row.code] ??= []).push({ t: Number(row.year), label: row.year, value });
		}
		for (const points of Object.values(out)) points.sort((a, b) => a.t - b.t);
		return out;
	});
}
