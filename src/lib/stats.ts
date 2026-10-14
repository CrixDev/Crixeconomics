import { isComparable, type MetricDef } from './indicators';
import type { MetricSnapshot, Peer, Point } from './types';

/** Datos más viejos que esto no entran a rankings ni a la matriz. */
export const RANK_WINDOW_YEARS = 10;
/** A partir de esta antigüedad se avisa que el dato es viejo. */
export const STALE_YEARS = 5;
/** Mínimo de países con dato para calcular la mediana regional de un año. */
const MIN_FOR_MEDIAN = 5;

export function latestObserved(points: Point[]): Point | null {
	for (let i = points.length - 1; i >= 0; i--) if (!points[i].projected) return points[i];
	return null;
}

export function currentProjection(points: Point[], year = new Date().getFullYear()): Point | null {
	return points.find((p) => p.projected && Math.floor(p.t) === year) ?? null;
}

export function median(values: number[]): number | null {
	if (!values.length) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = sorted.length >> 1;
	return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Último dato observado de cada país dentro de la ventana comparable, ordenado
 * del mejor al peor (o de mayor a menor si la métrica es neutral).
 */
export function rankPeers(
	byCountry: Record<string, Point[]>,
	def: Pick<MetricDef, 'better'>,
	year = new Date().getFullYear()
): Peer[] {
	const peers: Peer[] = [];
	for (const [iso3, points] of Object.entries(byCountry)) {
		const last = latestObserved(points);
		if (last && last.t >= year - RANK_WINDOW_YEARS) {
			peers.push({ iso3, value: last.value, label: last.label });
		}
	}
	const dir = def.better === 'down' ? 1 : -1;
	return peers.sort((a, b) => dir * (a.value - b.value));
}

/** 1 = primer lugar, 0 = último. */
export function scoreOf(peers: Peer[], iso3: string): number | null {
	const i = peers.findIndex((p) => p.iso3 === iso3);
	if (i < 0) return null;
	return peers.length > 1 ? 1 - i / (peers.length - 1) : 1;
}

/** Mediana regional año por año (solo observados, con suficientes países). */
export function medianSeries(byCountry: Record<string, Point[]>): Point[] {
	const byT = new Map<number, { label: string; values: number[] }>();
	for (const points of Object.values(byCountry)) {
		for (const p of points) {
			if (p.projected) continue;
			const slot = byT.get(p.t) ?? { label: p.label, values: [] };
			slot.values.push(p.value);
			byT.set(p.t, slot);
		}
	}
	return [...byT.entries()]
		.filter(([, s]) => s.values.length >= MIN_FOR_MEDIAN)
		.sort(([a], [b]) => a - b)
		.map(([t, s]) => ({ t, label: s.label, value: median(s.values)! }));
}

export function snapshot(
	def: MetricDef,
	byCountry: Record<string, Point[]>,
	iso3: string,
	error?: string,
	year = new Date().getFullYear()
): MetricSnapshot {
	const series = byCountry[iso3] ?? [];
	const latest = latestObserved(series);
	const comparable = isComparable(def);
	const peers = comparable ? rankPeers(byCountry, def, year) : [];
	const rankIndex = peers.findIndex((p) => p.iso3 === iso3);
	return {
		id: def.id,
		series,
		latest,
		projection: def.projections ? currentProjection(series, year) : null,
		rank: rankIndex >= 0 ? rankIndex + 1 : null,
		ranked: peers.length,
		median: median(peers.map((p) => p.value)),
		score: scoreOf(peers, iso3),
		peers,
		medianSeries: comparable ? medianSeries(byCountry) : [],
		stale: latest ? latest.t < year - STALE_YEARS : false,
		error
	};
}
