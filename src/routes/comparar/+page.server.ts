import { getCountry } from '$lib/countries';
import { getMetricDef, INDICATORS } from '$lib/indicators';
import { getRegion } from '$lib/server/data';
import { snapshot } from '$lib/stats';
import type { PageServerLoad } from './$types';

const MAX_COUNTRIES = 5;
const DEFAULT = ['MEX', 'BRA', 'ARG', 'COL', 'CHL'];

export type CompareCell = {
	value: number;
	label: string;
	rank: number | null;
	ranked: number;
} | null;

export const load: PageServerLoad = ({ url, setHeaders }) => {
	const requested = (url.searchParams.get('p') ?? '')
		.split(',')
		.map((code) => getCountry(code.trim())?.iso3)
		.filter((c): c is string => !!c);
	const selected = [...new Set(requested.length ? requested : DEFAULT)].slice(0, MAX_COUNTRIES);

	setHeaders({
		'cache-control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
	});

	const table = Promise.all(
		INDICATORS.map(async (ind) => ({
			slug: ind.slug,
			metrics: await Promise.all(
				ind.metrics.map(async (id) => {
					const region = await getRegion(id);
					const def = getMetricDef(id);
					const cells: Record<string, CompareCell> = {};
					for (const iso3 of selected) {
						const snap = snapshot(def, region.byCountry, iso3);
						cells[iso3] = snap.latest
							? {
									value: snap.latest.value,
									label: snap.latest.label,
									rank: snap.rank,
									ranked: snap.ranked
								}
							: null;
					}
					return { id, cells };
				})
			)
		}))
	);

	return { selected, table };
};
