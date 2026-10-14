import { error, json } from '@sveltejs/kit';
import { METRIC_BY_ID, sourceLabel } from '$lib/indicators';
import { getRegion } from '$lib/server/data';
import { median, medianSeries, rankPeers } from '$lib/stats';
import type { RequestHandler } from './$types';

/** Serie regional de una métrica: datos por país, ranking y mediana. */
export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const def = METRIC_BY_ID.get(params.id);
	if (!def) error(404, `Métrica desconocida: ${params.id}`);

	const region = await getRegion(def.id);
	const peers = rankPeers(region.byCountry, def);

	setHeaders({
		'cache-control': region.error
			? 'no-store'
			: 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400'
	});
	return json({
		id: def.id,
		label: def.label,
		unit: def.unit,
		better: def.better ?? null,
		hint: def.hint ?? null,
		source: sourceLabel(def),
		peers,
		median: median(peers.map((p) => p.value)),
		medianSeries: medianSeries(region.byCountry),
		byCountry: region.byCountry,
		error: region.error ?? null
	});
};
