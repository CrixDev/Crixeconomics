import { getMatrix, getRegion } from '$lib/server/data';
import { latestObserved, median } from '$lib/stats';
import type { PageServerLoad } from './$types';

async function regionalSummary() {
	const [pop, gdp, growth, inflation] = await Promise.all(
		['pop', 'gdp', 'growth', 'inflation'].map(getRegion)
	);
	const latest = (r: typeof pop) =>
		Object.values(r.byCountry)
			.map(latestObserved)
			.filter((p) => p != null);
	const sum = (r: typeof pop) => latest(r).reduce((s, p) => s + p.value, 0);
	const year = (r: typeof pop) => Math.max(0, ...latest(r).map((p) => p.t));
	return {
		pop: sum(pop),
		gdp: sum(gdp),
		growth: median(latest(growth).map((p) => p.value)),
		inflation: median(latest(inflation).map((p) => p.value)),
		year: year(gdp)
	};
}

export const load: PageServerLoad = ({ setHeaders }) => {
	setHeaders({
		'cache-control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
	});
	return {
		summary: regionalSummary(),
		matrix: getMatrix()
	};
};
