import { json } from '@sveltejs/kit';
import { INDICATORS, METRICS, SOURCES } from '$lib/indicators';
import type { RequestHandler } from './$types';

/** Catálogo: indicadores, métricas y de qué API sale cada una. */
export const GET: RequestHandler = () => {
	return json(
		{
			indicators: INDICATORS.map(({ n, slug, title, group, summary, metrics, headline }) => ({
				n,
				slug,
				title,
				group,
				summary,
				metrics,
				headline
			})),
			metrics: METRICS.map(({ id, label, unit, better, hint, via, origin, fetch }) => ({
				id,
				label,
				unit,
				better: better ?? null,
				hint: hint ?? null,
				source: SOURCES[via].name,
				origin: origin ?? null,
				code: fetch.kind === 'derived' ? null : fetch,
				derivedFrom: fetch.kind === 'derived' ? fetch.inputs : null,
				endpoint: `/api/metricas/${id}`
			}))
		},
		{ headers: { 'cache-control': 'public, max-age=3600' } }
	);
};
