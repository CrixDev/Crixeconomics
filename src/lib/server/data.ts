import { COUNTRY_CODES } from '$lib/countries';
import { getMetricDef, INDICATORS, METRICS, type GroupId, type MetricDef } from '$lib/indicators';
import { rankPeers, scoreOf, snapshot } from '$lib/stats';
import type { IndicatorView, MatrixRow, MetricSnapshot, Point, RegionSeries } from '$lib/types';
import { getBis } from './sources/bis';
import { getIlo } from './sources/ilo';
import { getImf } from './sources/imf';
import { getOwid } from './sources/owid';
import { getWorldBank } from './sources/worldbank';

async function load(def: MetricDef): Promise<Record<string, Point[]>> {
	const f = def.fetch;
	switch (f.kind) {
		case 'wb':
			return getWorldBank(f.code, f.source);
		case 'imf':
			return getImf(f.code, f.scale);
		case 'owid':
			return getOwid(f.slug, f.column);
		case 'ilo':
			return getIlo(f.flow, f.cur);
		case 'bis':
			return getBis(f.transform);
		case 'derived': {
			const specs = f.inputs.map((input) => {
				const [id, lag] = input.split('@');
				return { id, lag: Number(lag ?? 0) };
			});
			const inputs = await Promise.all(specs.map((s) => getRegion(s.id)));
			const failed = inputs.find((i) => i.error);
			if (failed) throw new Error(failed.error);
			const [base, ...rest] = inputs;
			const lags = specs.slice(1).map((s) => s.lag);
			const out: Record<string, Point[]> = {};
			for (const [iso3, points] of Object.entries(base.byCountry)) {
				const others = rest.map(
					(r) => new Map((r.byCountry[iso3] ?? []).map((p) => [p.t, p.value]))
				);
				const derived = points.flatMap((p) => {
					const values = others.map((m, i) => m.get(p.t + lags[i]));
					const value = f.compute([p.value, ...values], iso3);
					return value != null && Number.isFinite(value)
						? [{ t: p.t, label: p.label, value, projected: p.projected }]
						: [];
				});
				if (derived.length) out[iso3] = derived;
			}
			return out;
		}
	}
}

/** Serie regional de una métrica. Nunca lanza: los fallos de la API viajan en `error`. */
export async function getRegion(id: string): Promise<RegionSeries> {
	const def = getMetricDef(id);
	try {
		return { id, byCountry: await load(def) };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`[datos] ${id}: ${message}`);
		return {
			id,
			byCountry: {},
			error: `No se pudo consultar ${def.via.toUpperCase()}: ${message}`
		};
	}
}

export async function getSnapshot(id: string, iso3: string): Promise<MetricSnapshot> {
	const region = await getRegion(id);
	return snapshot(getMetricDef(id), region.byCountry, iso3, region.error);
}

export async function getIndicatorViews(group: GroupId, iso3: string): Promise<IndicatorView[]> {
	const indicators = INDICATORS.filter((i) => i.group === group);
	return Promise.all(
		indicators.map(async (ind) => ({
			slug: ind.slug,
			metrics: await Promise.all(ind.metrics.map((id) => getSnapshot(id, iso3)))
		}))
	);
}

/** Matriz países × indicadores con la métrica principal de cada uno. */
export async function getMatrix(): Promise<MatrixRow[]> {
	const regions = await Promise.all(INDICATORS.map((i) => getRegion(i.headline)));
	const rows: MatrixRow[] = COUNTRY_CODES.map((iso3) => ({ iso3, cells: {} }));
	regions.forEach((region, idx) => {
		const def = getMetricDef(INDICATORS[idx].headline);
		const peers = rankPeers(region.byCountry, def);
		for (const row of rows) {
			const peer = peers.find((p) => p.iso3 === row.iso3);
			row.cells[def.id] = peer
				? { value: peer.value, label: peer.label, score: scoreOf(peers, row.iso3) }
				: null;
		}
	});
	return rows;
}

/** Dispara la descarga de todas las series para que la primera visita sea rápida. */
export function warmCache(): void {
	for (const m of METRICS) void getRegion(m.id);
}
