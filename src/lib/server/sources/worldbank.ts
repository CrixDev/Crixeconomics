import { COUNTRY_CODES } from '$lib/countries';
import { METRICS } from '$lib/indicators';
import type { Point } from '$lib/types';
import { cached, HOUR } from '../cache';
import { getJson } from '../http';

const BASE = 'https://api.worldbank.org/v2';
const FIRST_YEAR = 1995;
const CHUNK = 12;

type WbRow = {
	indicator: { id: string };
	countryiso3code: string;
	date: string;
	value: number | null;
};
type WbResponse = [{ page: number; pages: number; message?: unknown }, WbRow[] | null];

export type WbTable = Map<string, Record<string, Point[]>>;

/** Agrupa todos los códigos del catálogo por fuente y en lotes de 12 por petición. */
const CHUNKS: { source: number; codes: string[] }[] = (() => {
	const bySource = new Map<number, string[]>();
	for (const m of METRICS) {
		if (m.fetch.kind !== 'wb') continue;
		const source = m.fetch.source ?? 2;
		const list = bySource.get(source) ?? [];
		if (!list.includes(m.fetch.code)) list.push(m.fetch.code);
		bySource.set(source, list);
	}
	const chunks: { source: number; codes: string[] }[] = [];
	for (const [source, codes] of bySource) {
		for (let i = 0; i < codes.length; i += CHUNK)
			chunks.push({ source, codes: codes.slice(i, i + CHUNK) });
	}
	return chunks;
})();

function url(codes: string[], source: number): string {
	const year = new Date().getFullYear();
	return (
		`${BASE}/country/${COUNTRY_CODES.join(';')}/indicator/${codes.join(';')}` +
		`?source=${source}&format=json&per_page=20000&date=${FIRST_YEAR}:${year}`
	);
}

function toTable(rows: WbRow[]): WbTable {
	const table: WbTable = new Map();
	for (const row of rows) {
		if (row.value == null || !row.countryiso3code) continue;
		const year = Number(row.date);
		const byCountry = table.get(row.indicator.id) ?? {};
		(byCountry[row.countryiso3code] ??= []).push({ t: year, label: row.date, value: row.value });
		table.set(row.indicator.id, byCountry);
	}
	for (const byCountry of table.values()) {
		for (const points of Object.values(byCountry)) points.sort((a, b) => a.t - b.t);
	}
	return table;
}

async function fetchChunk(codes: string[], source: number): Promise<WbTable> {
	const [meta, rows] = await getJson<WbResponse>(url(codes, source), {
		timeoutMs: 60_000,
		retries: 2
	});
	if (meta?.message || !rows) {
		// Un solo código inválido invalida el lote completo: pedirlos uno por uno.
		if (codes.length > 1) {
			const parts = await Promise.allSettled(codes.map((c) => fetchChunk([c], source)));
			const merged: WbTable = new Map();
			for (const p of parts)
				if (p.status === 'fulfilled') for (const [k, v] of p.value) merged.set(k, v);
			return merged;
		}
		return new Map();
	}
	if (meta.pages > 1) throw new Error('Respuesta del Banco Mundial paginada inesperadamente');
	return toTable(rows);
}

export async function getWorldBank(code: string, source = 2): Promise<Record<string, Point[]>> {
	const chunk = CHUNKS.find((c) => c.source === source && c.codes.includes(code));
	const codes = chunk?.codes ?? [code];
	const table = await cached(`wb:${source}:${codes.join(',')}`, 12 * HOUR, () =>
		fetchChunk(codes, source)
	);
	return table.get(code) ?? {};
}
