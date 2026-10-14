import { error, json } from '@sveltejs/kit';
import { getCountry } from '$lib/countries';
import { INDICATORS } from '$lib/indicators';
import { getSnapshot } from '$lib/server/data';
import { getTrade } from '$lib/server/sources/comtrade';
import { getFx } from '$lib/server/sources/fx';
import type { RequestHandler } from './$types';

/** Perfil completo de un país: los 20 indicadores con su último dato, ranking y serie. */
export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const country = getCountry(params.iso3);
	if (!country) error(404, `País fuera de la cobertura: ${params.iso3}`);

	const [indicators, fx, trade] = await Promise.all([
		Promise.all(
			INDICATORS.map(async (ind) => ({
				n: ind.n,
				slug: ind.slug,
				title: ind.title,
				metrics: (await Promise.all(ind.metrics.map((id) => getSnapshot(id, country.iso3)))).map(
					({ id, latest, projection, rank, ranked, median, series, error }) => ({
						id,
						latest,
						projection,
						rank,
						ranked,
						regionalMedian: median,
						series,
						error: error ?? null
					})
				)
			}))
		),
		getFx(country.iso3).catch(() => null),
		getTrade(country.iso3).catch(() => null)
	]);

	setHeaders({
		'cache-control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400'
	});
	return json({ country, indicators, fx, trade });
};
