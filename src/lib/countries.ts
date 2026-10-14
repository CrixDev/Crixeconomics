export type Subregion = 'Norteamérica' | 'Centroamérica' | 'Caribe' | 'Sudamérica';

export type Country = {
	iso3: string;
	iso2: string;
	/** Código numérico M49 (lo usa UN Comtrade). */
	m49: number;
	name: string;
	capital: string;
	subregion: Subregion;
	currency: string;
	currencyName: string;
	/** Advertencias sobre el régimen cambiario o la calidad de los datos. */
	note?: string;
};

/** Las 20 repúblicas de América Latina. */
export const COUNTRIES: Country[] = [
	{
		iso3: 'ARG',
		iso2: 'AR',
		m49: 32,
		name: 'Argentina',
		capital: 'Buenos Aires',
		subregion: 'Sudamérica',
		currency: 'ARS',
		currencyName: 'peso argentino',
		note: 'Ha convivido con varios tipos de cambio (oficial y paralelos); el de referencia puede diferir del que enfrenta la población.'
	},
	{
		iso3: 'BOL',
		iso2: 'BO',
		m49: 68,
		name: 'Bolivia',
		capital: 'Sucre / La Paz',
		subregion: 'Sudamérica',
		currency: 'BOB',
		currencyName: 'boliviano',
		note: 'Tipo de cambio oficial fijo durante más de una década, con un mercado paralelo creciente desde 2023.'
	},
	{
		iso3: 'BRA',
		iso2: 'BR',
		m49: 76,
		name: 'Brasil',
		capital: 'Brasilia',
		subregion: 'Sudamérica',
		currency: 'BRL',
		currencyName: 'real'
	},
	{
		iso3: 'CHL',
		iso2: 'CL',
		m49: 152,
		name: 'Chile',
		capital: 'Santiago',
		subregion: 'Sudamérica',
		currency: 'CLP',
		currencyName: 'peso chileno'
	},
	{
		iso3: 'COL',
		iso2: 'CO',
		m49: 170,
		name: 'Colombia',
		capital: 'Bogotá',
		subregion: 'Sudamérica',
		currency: 'COP',
		currencyName: 'peso colombiano'
	},
	{
		iso3: 'CRI',
		iso2: 'CR',
		m49: 188,
		name: 'Costa Rica',
		capital: 'San José',
		subregion: 'Centroamérica',
		currency: 'CRC',
		currencyName: 'colón costarricense'
	},
	{
		iso3: 'CUB',
		iso2: 'CU',
		m49: 192,
		name: 'Cuba',
		capital: 'La Habana',
		subregion: 'Caribe',
		currency: 'CUP',
		currencyName: 'peso cubano',
		note: 'El tipo de cambio oficial y el informal difieren por mucho; varias series internacionales no cubren a Cuba.'
	},
	{
		iso3: 'DOM',
		iso2: 'DO',
		m49: 214,
		name: 'República Dominicana',
		capital: 'Santo Domingo',
		subregion: 'Caribe',
		currency: 'DOP',
		currencyName: 'peso dominicano'
	},
	{
		iso3: 'ECU',
		iso2: 'EC',
		m49: 218,
		name: 'Ecuador',
		capital: 'Quito',
		subregion: 'Sudamérica',
		currency: 'USD',
		currencyName: 'dólar estadounidense',
		note: 'Economía dolarizada desde 2000: no tiene moneda propia.'
	},
	{
		iso3: 'SLV',
		iso2: 'SV',
		m49: 222,
		name: 'El Salvador',
		capital: 'San Salvador',
		subregion: 'Centroamérica',
		currency: 'USD',
		currencyName: 'dólar estadounidense',
		note: 'Economía dolarizada desde 2001.'
	},
	{
		iso3: 'GTM',
		iso2: 'GT',
		m49: 320,
		name: 'Guatemala',
		capital: 'Ciudad de Guatemala',
		subregion: 'Centroamérica',
		currency: 'GTQ',
		currencyName: 'quetzal'
	},
	{
		iso3: 'HTI',
		iso2: 'HT',
		m49: 332,
		name: 'Haití',
		capital: 'Puerto Príncipe',
		subregion: 'Caribe',
		currency: 'HTG',
		currencyName: 'gourde'
	},
	{
		iso3: 'HND',
		iso2: 'HN',
		m49: 340,
		name: 'Honduras',
		capital: 'Tegucigalpa',
		subregion: 'Centroamérica',
		currency: 'HNL',
		currencyName: 'lempira'
	},
	{
		iso3: 'MEX',
		iso2: 'MX',
		m49: 484,
		name: 'México',
		capital: 'Ciudad de México',
		subregion: 'Norteamérica',
		currency: 'MXN',
		currencyName: 'peso mexicano'
	},
	{
		iso3: 'NIC',
		iso2: 'NI',
		m49: 558,
		name: 'Nicaragua',
		capital: 'Managua',
		subregion: 'Centroamérica',
		currency: 'NIO',
		currencyName: 'córdoba'
	},
	{
		iso3: 'PAN',
		iso2: 'PA',
		m49: 591,
		name: 'Panamá',
		capital: 'Ciudad de Panamá',
		subregion: 'Centroamérica',
		currency: 'PAB',
		currencyName: 'balboa',
		note: 'El balboa está a la par del dólar, que circula como moneda de uso corriente.'
	},
	{
		iso3: 'PRY',
		iso2: 'PY',
		m49: 600,
		name: 'Paraguay',
		capital: 'Asunción',
		subregion: 'Sudamérica',
		currency: 'PYG',
		currencyName: 'guaraní'
	},
	{
		iso3: 'PER',
		iso2: 'PE',
		m49: 604,
		name: 'Perú',
		capital: 'Lima',
		subregion: 'Sudamérica',
		currency: 'PEN',
		currencyName: 'sol'
	},
	{
		iso3: 'URY',
		iso2: 'UY',
		m49: 858,
		name: 'Uruguay',
		capital: 'Montevideo',
		subregion: 'Sudamérica',
		currency: 'UYU',
		currencyName: 'peso uruguayo'
	},
	{
		iso3: 'VEN',
		iso2: 'VE',
		m49: 862,
		name: 'Venezuela',
		capital: 'Caracas',
		subregion: 'Sudamérica',
		currency: 'VES',
		currencyName: 'bolívar',
		note: 'Hiperinflación reciente, varios tipos de cambio y estadísticas oficiales escasas: muchas series se interrumpen.'
	}
];

export const COUNTRY_CODES = COUNTRIES.map((c) => c.iso3);

const byIso3 = new Map(COUNTRIES.map((c) => [c.iso3, c]));

export function getCountry(iso3: string): Country | undefined {
	return byIso3.get(iso3.toUpperCase());
}

export function flagUrl(iso2: string): string {
	return `https://flagcdn.com/${iso2.toLowerCase()}.svg`;
}
