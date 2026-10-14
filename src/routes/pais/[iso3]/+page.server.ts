import { error, redirect } from '@sveltejs/kit';
import { getCountry } from '$lib/countries';
import { getIndicatorViews, getSnapshot } from '$lib/server/data';
import { getTrade } from '$lib/server/sources/comtrade';
import { getFx } from '$lib/server/sources/fx';
import type { PageServerLoad } from './$types';

const KPIS = ['pop', 'gdp', 'gdppc_ppp', 'growth', 'inflation', 'hdi'];

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const country = getCountry(params.iso3);
	if (!country) error(404, 'Ese país no está en la base de América Latina.');
	if (params.iso3 !== country.iso3.toLowerCase())
		redirect(301, `/pais/${country.iso3.toLowerCase()}`);

	setHeaders({
		'cache-control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
	});

	const iso3 = country.iso3;
	// Promesas sin await: SvelteKit las transmite por streaming y cada bloque aparece al estar listo.
	return {
		country,
		kpis: Promise.all(KPIS.map((id) => getSnapshot(id, iso3))),
		economia: getIndicatorViews('economia', iso3),
		bienestar: getIndicatorViews('bienestar', iso3),
		poder: getIndicatorViews('poder', iso3),
		fx: getFx(iso3).catch(() => null),
		trade: getTrade(iso3).catch(() => null)
	};
};
