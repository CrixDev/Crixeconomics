/**
 * Catálogo de los 20 indicadores. Cada indicador agrupa varias métricas; cada
 * métrica sabe de qué API pública sale y cómo se formatea.
 */

export type Unit =
	| 'people'
	| 'usd'
	| 'intl'
	| 'pct'
	| 'per_km2'
	| 'km2'
	| 'years'
	| 'per_1000'
	| 'index'
	| 'score10'
	| 'score100'
	| 'wgi'
	| 'hdi'
	| 'lcu_per_usd'
	| 'lcu_per_intl'
	| 'ratio'
	| 'months'
	| 'usd_month'
	| 'ppp_month'
	| 'lcu_month'
	| 'times';

export type SourceId = 'wb' | 'wgi' | 'cwon' | 'imf' | 'ilo' | 'owid' | 'bis' | 'fx' | 'comtrade';

export type Fetcher =
	| { kind: 'wb'; code: string; source?: 2 | 3 | 59 | 63 }
	| { kind: 'imf'; code: string; scale?: number }
	| { kind: 'owid'; slug: string; column: string }
	| { kind: 'ilo'; flow: 'INEE' | 'EMTM'; cur: 'LCU' | 'USD' | 'PPP' }
	| { kind: 'bis'; transform: 'level' | 'yoy' }
	| {
			kind: 'derived';
			/** Ids de métricas; el sufijo `@-1` toma el valor del año anterior. */
			inputs: string[];
			compute: (values: (number | undefined)[], iso3: string) => number | null;
	  };

export type MetricDef = {
	id: string;
	label: string;
	unit: Unit;
	fetch: Fetcher;
	/** Qué dirección se considera "mejor" al comparar países. Sin valor = neutral. */
	better?: 'up' | 'down';
	/** Mostrar signo (+/−) y colorear según sea positivo o negativo. */
	signed?: boolean;
	decimals?: number;
	hint?: string;
	/** La serie incluye proyecciones (FMI): los años >= año en curso se marcan. */
	projections?: boolean;
	via: SourceId;
	/** Fuente original cuando la API es un redistribuidor (p. ej. OWID). */
	origin?: string;
};

export type GroupId = 'economia' | 'bienestar' | 'poder';

export type IndicatorDef = {
	n: number;
	slug: string;
	title: string;
	group: GroupId;
	summary: string;
	metrics: string[];
	/** Métrica que representa al indicador en la matriz regional. */
	headline: string;
	widget?: 'fx' | 'composition' | 'trade' | 'wages';
	note?: string;
	/** Lo que pide el indicador pero no existe en ninguna API pública abierta. */
	gaps?: string[];
};

export const GROUPS: { id: GroupId; title: string; kicker: string }[] = [
	{ id: 'economia', title: 'Economía y riqueza', kicker: 'Indicadores 1–10' },
	{
		id: 'bienestar',
		title: 'Empleo, bienestar y distribución de la riqueza',
		kicker: 'Indicadores 11–17'
	},
	{
		id: 'poder',
		title: 'Poder político, estabilidad y capacidad estratégica',
		kicker: 'Indicadores 18–20'
	}
];

export const SOURCES: Record<SourceId, { name: string; short: string; url: string; api: string }> =
	{
		wb: {
			name: 'Banco Mundial · World Development Indicators',
			short: 'Banco Mundial',
			url: 'https://data.worldbank.org',
			api: 'https://api.worldbank.org/v2'
		},
		wgi: {
			name: 'Banco Mundial · Worldwide Governance Indicators',
			short: 'Banco Mundial (WGI)',
			url: 'https://www.worldbank.org/en/publication/worldwide-governance-indicators',
			api: 'https://api.worldbank.org/v2 (source=3)'
		},
		cwon: {
			name: 'Banco Mundial · The Changing Wealth of Nations',
			short: 'Banco Mundial (CWON)',
			url: 'https://www.worldbank.org/en/publication/changing-wealth-of-nations',
			api: 'https://api.worldbank.org/v2 (source=59)'
		},
		imf: {
			name: 'Fondo Monetario Internacional · World Economic Outlook',
			short: 'FMI',
			url: 'https://www.imf.org/external/datamapper',
			api: 'https://www.imf.org/external/datamapper/api/v1'
		},
		ilo: {
			name: 'Organización Internacional del Trabajo · ILOSTAT',
			short: 'OIT',
			url: 'https://ilostat.ilo.org',
			api: 'https://sdmx.ilo.org/rest'
		},
		owid: {
			name: 'Our World in Data (redistribuye PNUD, Transparency International, WHR y WID)',
			short: 'Our World in Data',
			url: 'https://ourworldindata.org',
			api: 'https://ourworldindata.org/grapher/{slug}.csv'
		},
		bis: {
			name: 'Banco de Pagos Internacionales · Residential property prices',
			short: 'BIS',
			url: 'https://data.bis.org/topics/RPP',
			api: 'https://stats.bis.org/api/v2'
		},
		fx: {
			name: 'Exchange API (tipos de cambio de mercado diarios)',
			short: 'Exchange API',
			url: 'https://github.com/fawazahmed0/exchange-api',
			api: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api'
		},
		comtrade: {
			name: 'Naciones Unidas · UN Comtrade',
			short: 'UN Comtrade',
			url: 'https://comtradeplus.un.org',
			api: 'https://comtradeapi.un.org/public/v1/preview'
		}
	};

/** Monedas cuyo tipo de cambio frente al dólar es 1 por definición. */
const USD_PEGGED = new Set(['ECU', 'SLV', 'PAN']);

const wb = (code: string, source: 2 | 3 | 59 | 63 = 2): Fetcher => ({ kind: 'wb', code, source });

export const METRICS: MetricDef[] = [
	// 1 · Población
	{ id: 'pop', label: 'Población total', unit: 'people', fetch: wb('SP.POP.TOTL'), via: 'wb' },
	{
		id: 'pop_growth',
		label: 'Crecimiento de la población',
		unit: 'pct',
		signed: true,
		decimals: 2,
		fetch: wb('SP.POP.GROW'),
		via: 'wb'
	},
	{
		id: 'urban',
		label: 'Población urbana',
		unit: 'pct',
		fetch: wb('SP.URB.TOTL.IN.ZS'),
		via: 'wb',
		hint: '% de la población total'
	},
	// 2 · Densidad
	{
		id: 'density',
		label: 'Densidad poblacional',
		unit: 'per_km2',
		fetch: wb('EN.POP.DNST'),
		via: 'wb'
	},
	{
		id: 'land',
		label: 'Superficie terrestre',
		unit: 'km2',
		fetch: wb('AG.LND.TOTL.K2'),
		via: 'wb'
	},
	// 3 · PIB nominal
	{
		id: 'gdp',
		label: 'PIB nominal',
		unit: 'usd',
		fetch: wb('NY.GDP.MKTP.CD'),
		via: 'wb',
		hint: 'Dólares corrientes'
	},
	{
		id: 'gdp_imf',
		label: 'PIB nominal (FMI, con proyección)',
		unit: 'usd',
		fetch: { kind: 'imf', code: 'NGDPD', scale: 1e9 },
		via: 'imf',
		projections: true
	},
	// 4 · PIB per cápita PPA
	{
		id: 'gdppc_ppp',
		label: 'PIB per cápita (PPA)',
		unit: 'intl',
		better: 'up',
		fetch: wb('NY.GDP.PCAP.PP.CD'),
		via: 'wb',
		hint: 'Dólares internacionales corrientes'
	},
	{
		id: 'gdppc_usd',
		label: 'PIB per cápita (US$ de mercado)',
		unit: 'usd',
		better: 'up',
		fetch: wb('NY.GDP.PCAP.CD'),
		via: 'wb'
	},
	{
		id: 'gdppc_ppp_imf',
		label: 'PIB per cápita PPA (FMI, con proyección)',
		unit: 'intl',
		better: 'up',
		fetch: { kind: 'imf', code: 'PPPPC' },
		via: 'imf',
		projections: true
	},
	// 5 · Crecimiento real
	{
		id: 'growth',
		label: 'Crecimiento real del PIB',
		unit: 'pct',
		signed: true,
		better: 'up',
		fetch: wb('NY.GDP.MKTP.KD.ZG'),
		via: 'wb'
	},
	{
		id: 'growth_imf',
		label: 'Crecimiento real (FMI, con proyección)',
		unit: 'pct',
		signed: true,
		better: 'up',
		fetch: { kind: 'imf', code: 'NGDP_RPCH' },
		via: 'imf',
		projections: true
	},
	// 6 · Inflación
	{
		id: 'inflation',
		label: 'Inflación anual (IPC)',
		unit: 'pct',
		better: 'down',
		fetch: wb('FP.CPI.TOTL.ZG'),
		via: 'wb'
	},
	{
		id: 'inflation_imf',
		label: 'Inflación promedio (FMI, con proyección)',
		unit: 'pct',
		better: 'down',
		fetch: { kind: 'imf', code: 'PCPIPCH' },
		via: 'imf',
		projections: true
	},
	// 7 · Tipo de cambio
	{
		id: 'fx_official',
		label: 'Tipo de cambio oficial (promedio anual)',
		unit: 'lcu_per_usd',
		decimals: 2,
		fetch: wb('PA.NUS.FCRF'),
		via: 'wb',
		hint: 'Unidades de moneda local por dólar'
	},
	{
		id: 'fx_dep',
		label: 'Depreciación anual frente al dólar',
		unit: 'pct',
		signed: true,
		better: 'down',
		fetch: {
			kind: 'derived',
			inputs: ['fx_official', 'fx_official@-1'],
			compute: ([now, prev]) => (now != null && prev ? (now / prev - 1) * 100 : null)
		},
		via: 'wb',
		hint: 'Cambio del tipo oficial promedio vs. el año anterior · + = la moneda perdió valor'
	},
	{
		id: 'reer',
		label: 'Tipo de cambio real efectivo',
		unit: 'index',
		fetch: wb('PX.REX.REER'),
		via: 'wb',
		hint: 'Índice 2010 = 100; subir = apreciación real'
	},
	{
		id: 'ppp_factor',
		label: 'Factor de conversión PPA',
		unit: 'lcu_per_intl',
		decimals: 2,
		fetch: wb('PA.NUS.PPP'),
		via: 'wb',
		hint: 'Moneda local por dólar internacional'
	},
	// 8 · Composición del PIB
	{
		id: 'agri',
		label: 'Agricultura, silvicultura y pesca',
		unit: 'pct',
		fetch: wb('NV.AGR.TOTL.ZS'),
		via: 'wb',
		hint: '% del PIB'
	},
	{
		id: 'industry',
		label: 'Industria (incluye construcción, minería y energía)',
		unit: 'pct',
		fetch: wb('NV.IND.TOTL.ZS'),
		via: 'wb',
		hint: '% del PIB'
	},
	{
		id: 'manuf',
		label: 'Manufactura',
		unit: 'pct',
		fetch: wb('NV.IND.MANF.ZS'),
		via: 'wb',
		hint: '% del PIB · subconjunto de industria'
	},
	{
		id: 'services',
		label: 'Servicios',
		unit: 'pct',
		fetch: wb('NV.SRV.TOTL.ZS'),
		via: 'wb',
		hint: '% del PIB'
	},
	{
		id: 'rents_oil',
		label: 'Rentas del petróleo',
		unit: 'pct',
		fetch: wb('NY.GDP.PETR.RT.ZS'),
		via: 'wb',
		hint: '% del PIB'
	},
	{
		id: 'rents_gas',
		label: 'Rentas del gas natural',
		unit: 'pct',
		fetch: wb('NY.GDP.NGAS.RT.ZS'),
		via: 'wb',
		hint: '% del PIB'
	},
	{
		id: 'rents_min',
		label: 'Rentas minerales',
		unit: 'pct',
		fetch: wb('NY.GDP.MINR.RT.ZS'),
		via: 'wb',
		hint: '% del PIB'
	},
	{
		id: 'ict_exports',
		label: 'Exportaciones de servicios TIC',
		unit: 'pct',
		fetch: wb('BX.GSR.CCIS.ZS'),
		via: 'wb',
		hint: '% de las exportaciones de servicios · aproximación al sector tecnológico'
	},
	// 9 · Comercio exterior
	{
		id: 'exports',
		label: 'Exportaciones de bienes y servicios',
		unit: 'usd',
		fetch: wb('NE.EXP.GNFS.CD'),
		via: 'wb'
	},
	{
		id: 'imports',
		label: 'Importaciones de bienes y servicios',
		unit: 'usd',
		fetch: wb('NE.IMP.GNFS.CD'),
		via: 'wb'
	},
	{
		id: 'trade_balance',
		label: 'Balanza de bienes y servicios',
		unit: 'usd',
		signed: true,
		fetch: {
			kind: 'derived',
			inputs: ['exports', 'imports'],
			compute: ([x, m]) => (x != null && m != null ? x - m : null)
		},
		via: 'wb',
		hint: 'Exportaciones − importaciones'
	},
	{
		id: 'trade_open',
		label: 'Apertura comercial',
		unit: 'pct',
		fetch: wb('NE.TRD.GNFS.ZS'),
		via: 'wb',
		hint: '(Exportaciones + importaciones) / PIB'
	},
	{
		id: 'fdi',
		label: 'Inversión extranjera directa neta',
		unit: 'pct',
		signed: true,
		fetch: wb('BX.KLT.DINV.WD.GD.ZS'),
		via: 'wb',
		hint: 'Entradas netas, % del PIB'
	},
	// 10 · Riqueza nacional
	{
		id: 'wealth',
		label: 'Riqueza nacional integral',
		unit: 'usd',
		fetch: wb('NW.TOW.TO.CD', 59),
		via: 'cwon',
		hint: 'Capital producido + natural + humano + activos externos netos'
	},
	{
		id: 'wealth_pc',
		label: 'Riqueza integral per cápita',
		unit: 'usd',
		better: 'up',
		fetch: wb('NW.TOW.PC.CD', 59),
		via: 'cwon'
	},
	{
		id: 'wealth_gdp',
		label: 'Riqueza / PIB',
		unit: 'times',
		decimals: 1,
		fetch: {
			kind: 'derived',
			inputs: ['wealth', 'gdp'],
			compute: ([w, g]) => (w != null && g ? w / g : null)
		},
		via: 'cwon',
		hint: 'Cuántos años de producción equivale el patrimonio'
	},
	{
		id: 'nfa',
		label: 'Activos externos netos',
		unit: 'usd',
		signed: true,
		fetch: wb('NW.NFA.TO.CD', 59),
		via: 'cwon'
	},
	// 11 · Salarios y empleo
	{
		id: 'minwage_lcu',
		label: 'Salario mínimo mensual (moneda local)',
		unit: 'lcu_month',
		fetch: { kind: 'ilo', flow: 'INEE', cur: 'LCU' },
		via: 'ilo'
	},
	{
		id: 'minwage_usd',
		label: 'Salario mínimo mensual (US$)',
		unit: 'usd_month',
		better: 'up',
		fetch: { kind: 'ilo', flow: 'INEE', cur: 'USD' },
		via: 'ilo'
	},
	{
		id: 'minwage_ppp',
		label: 'Salario mínimo mensual (US$ PPA)',
		unit: 'ppp_month',
		better: 'up',
		fetch: { kind: 'ilo', flow: 'INEE', cur: 'PPP' },
		via: 'ilo'
	},
	{
		id: 'medwage_lcu',
		label: 'Salario mediano mensual (moneda local)',
		unit: 'lcu_month',
		fetch: { kind: 'ilo', flow: 'EMTM', cur: 'LCU' },
		via: 'ilo',
		hint: 'Ingreso mensual mediano de los asalariados'
	},
	{
		id: 'medwage_usd',
		label: 'Salario mediano mensual (US$)',
		unit: 'usd_month',
		better: 'up',
		fetch: { kind: 'ilo', flow: 'EMTM', cur: 'USD' },
		via: 'ilo'
	},
	{
		id: 'medwage_ppp',
		label: 'Salario mediano mensual (US$ PPA)',
		unit: 'ppp_month',
		better: 'up',
		fetch: { kind: 'ilo', flow: 'EMTM', cur: 'PPP' },
		via: 'ilo'
	},
	{
		id: 'kaitz',
		label: 'Salario mínimo / salario mediano',
		unit: 'ratio',
		decimals: 2,
		fetch: {
			kind: 'derived',
			inputs: ['minwage_lcu', 'medwage_lcu'],
			compute: ([min, med]) => (min != null && med ? min / med : null)
		},
		via: 'ilo',
		hint: 'Índice de Kaitz: qué tan "mordiente" es el mínimo'
	},
	{
		id: 'unemployment',
		label: 'Desempleo',
		unit: 'pct',
		better: 'down',
		fetch: wb('SL.UEM.TOTL.ZS'),
		via: 'wb',
		hint: 'Estimación modelada de la OIT, % de la fuerza laboral'
	},
	// 12 · Costo de vida y vivienda
	{
		id: 'price_level',
		label: 'Nivel de precios frente a EE. UU.',
		unit: 'ratio',
		decimals: 2,
		better: 'down',
		fetch: {
			kind: 'derived',
			inputs: ['ppp_factor', 'fx_official'],
			compute: ([ppp, fx], iso3) => {
				const rate = fx ?? (USD_PEGGED.has(iso3) ? 1 : undefined);
				return ppp != null && rate ? ppp / rate : null;
			}
		},
		via: 'wb',
		hint: 'Factor PPA / tipo de cambio. 0.5 = la canasta cuesta la mitad que en EE. UU.'
	},
	{
		id: 'house_real',
		label: 'Precio real de la vivienda',
		unit: 'index',
		fetch: { kind: 'bis', transform: 'level' },
		via: 'bis',
		hint: 'Índice 2010 = 100, descontada la inflación'
	},
	{
		id: 'house_real_yoy',
		label: 'Variación anual del precio real de la vivienda',
		unit: 'pct',
		signed: true,
		fetch: { kind: 'bis', transform: 'yoy' },
		via: 'bis'
	},
	// 13 · Pobreza
	{
		id: 'pov_nat',
		label: 'Pobreza (línea nacional)',
		unit: 'pct',
		better: 'down',
		fetch: wb('SI.POV.NAHC'),
		via: 'wb',
		hint: '% de la población · cada país define su línea'
	},
	{
		id: 'pov_300',
		label: 'Pobreza extrema internacional (US$ 3.00/día)',
		unit: 'pct',
		better: 'down',
		fetch: wb('SI.POV.DDAY'),
		via: 'wb',
		hint: '% de la población · PPA 2021'
	},
	{
		id: 'pov_830',
		label: 'Pobreza a US$ 8.30/día (países de ingreso medio-alto)',
		unit: 'pct',
		better: 'down',
		fetch: wb('SI.POV.UMIC'),
		via: 'wb',
		hint: '% de la población · PPA 2021'
	},
	// 14 · Desigualdad
	{
		id: 'gini',
		label: 'Coeficiente de Gini',
		unit: 'score100',
		decimals: 1,
		better: 'down',
		fetch: wb('SI.POV.GINI'),
		via: 'wb',
		hint: '0 = igualdad perfecta, 100 = desigualdad máxima'
	},
	{
		id: 'top10_income',
		label: 'Ingreso del 10 % más rico (encuestas)',
		unit: 'pct',
		better: 'down',
		fetch: wb('SI.DST.10TH.10'),
		via: 'wb',
		hint: '% del ingreso o consumo total'
	},
	{
		id: 'bottom20_income',
		label: 'Ingreso del 20 % más pobre',
		unit: 'pct',
		better: 'up',
		fetch: wb('SI.DST.FRST.20'),
		via: 'wb'
	},
	{
		id: 'top10_wid',
		label: 'Ingreso del 10 % más rico (WID, antes de impuestos)',
		unit: 'pct',
		better: 'down',
		fetch: {
			kind: 'owid',
			slug: 'income-share-top-10-before-tax-wid',
			column: 'share__welfare_type_before_tax__quantile_10__extrapolated_no'
		},
		via: 'owid',
		origin: 'World Inequality Database',
		hint: 'Combina encuestas, registros fiscales y cuentas nacionales'
	},
	// 15 · Salud
	{
		id: 'life_exp',
		label: 'Esperanza de vida al nacer',
		unit: 'years',
		better: 'up',
		fetch: wb('SP.DYN.LE00.IN'),
		via: 'wb'
	},
	{
		id: 'infant_mort',
		label: 'Mortalidad infantil',
		unit: 'per_1000',
		better: 'down',
		fetch: wb('SP.DYN.IMRT.IN'),
		via: 'wb',
		hint: 'Muertes antes del primer año por cada 1,000 nacidos vivos'
	},
	{
		id: 'health_exp',
		label: 'Gasto corriente en salud',
		unit: 'pct',
		fetch: wb('SH.XPD.CHEX.GD.ZS'),
		via: 'wb',
		hint: '% del PIB'
	},
	{
		id: 'oop',
		label: 'Gasto de bolsillo en salud',
		unit: 'pct',
		better: 'down',
		fetch: wb('SH.XPD.OOPC.CH.ZS'),
		via: 'wb',
		hint: '% del gasto corriente en salud que pagan directamente los hogares'
	},
	// 16 · Educación y desarrollo humano
	{
		id: 'hdi',
		label: 'Índice de Desarrollo Humano',
		unit: 'hdi',
		better: 'up',
		fetch: { kind: 'owid', slug: 'human-development-index', column: 'hdi__sex_total' },
		via: 'owid',
		origin: 'PNUD · Human Development Report'
	},
	{
		id: 'schooling',
		label: 'Años promedio de escolaridad',
		unit: 'years',
		better: 'up',
		fetch: { kind: 'owid', slug: 'average-years-of-schooling', column: 'mys__sex_total' },
		via: 'owid',
		origin: 'PNUD · Human Development Report',
		hint: 'Población de 25 años o más'
	},
	{
		id: 'lays',
		label: 'Años de escolaridad ajustados por aprendizaje',
		unit: 'years',
		better: 'up',
		fetch: wb('HD.HCI.LAYS', 63),
		via: 'wb',
		hint: 'Índice de Capital Humano: corrige los años por lo que realmente se aprende'
	},
	{
		id: 'edu_exp',
		label: 'Gasto público en educación',
		unit: 'pct',
		fetch: wb('SE.XPD.TOTL.GD.ZS'),
		via: 'wb',
		hint: '% del PIB'
	},
	{
		id: 'tertiary',
		label: 'Matrícula en educación superior',
		unit: 'pct',
		better: 'up',
		fetch: wb('SE.TER.ENRR'),
		via: 'wb',
		hint: 'Tasa bruta'
	},
	// 17 · Felicidad
	{
		id: 'happiness',
		label: 'Satisfacción con la vida',
		unit: 'score10',
		decimals: 2,
		better: 'up',
		fetch: {
			kind: 'owid',
			slug: 'happiness-cantril-ladder',
			column: 'cantril_ladder_score'
		},
		via: 'owid',
		origin: 'World Happiness Report (Gallup World Poll)',
		hint: 'Escalera de Cantril, de 0 a 10'
	},
	// 18 · Finanzas públicas
	{
		id: 'debt',
		label: 'Deuda bruta del gobierno general',
		unit: 'pct',
		better: 'down',
		fetch: { kind: 'imf', code: 'GGXWDG_NGDP' },
		via: 'imf',
		projections: true,
		hint: '% del PIB'
	},
	{
		id: 'fiscal_balance',
		label: 'Balance fiscal (préstamo neto)',
		unit: 'pct',
		signed: true,
		better: 'up',
		fetch: { kind: 'imf', code: 'GGXCNL_NGDP' },
		via: 'imf',
		projections: true,
		hint: '% del PIB · negativo = déficit'
	},
	{
		id: 'revenue',
		label: 'Ingresos del gobierno',
		unit: 'pct',
		fetch: { kind: 'imf', code: 'rev' },
		via: 'imf',
		origin: 'FMI · Public Finances in Modern History',
		hint: '% del PIB'
	},
	{
		id: 'spending',
		label: 'Gasto del gobierno',
		unit: 'pct',
		fetch: { kind: 'imf', code: 'exp' },
		via: 'imf',
		origin: 'FMI · Public Finances in Modern History',
		hint: '% del PIB'
	},
	{
		id: 'tax',
		label: 'Ingresos tributarios',
		unit: 'pct',
		fetch: wb('GC.TAX.TOTL.GD.ZS'),
		via: 'wb',
		hint: '% del PIB · gobierno central'
	},
	// 19 · Instituciones
	{
		id: 'cpi',
		label: 'Índice de Percepción de la Corrupción',
		unit: 'score100',
		decimals: 0,
		better: 'up',
		fetch: { kind: 'owid', slug: 'ti-corruption-perception-index', column: 'cpi_score' },
		via: 'owid',
		origin: 'Transparency International',
		hint: '0 = muy corrupto, 100 = muy limpio'
	},
	{
		id: 'wgi_rl',
		label: 'Estado de derecho',
		unit: 'wgi',
		better: 'up',
		fetch: wb('GOV_WGI_RL.EST', 3),
		via: 'wgi'
	},
	{
		id: 'wgi_ge',
		label: 'Eficacia gubernamental',
		unit: 'wgi',
		better: 'up',
		fetch: wb('GOV_WGI_GE.EST', 3),
		via: 'wgi'
	},
	{
		id: 'wgi_cc',
		label: 'Control de la corrupción',
		unit: 'wgi',
		better: 'up',
		fetch: wb('GOV_WGI_CC.EST', 3),
		via: 'wgi'
	},
	{
		id: 'wgi_rq',
		label: 'Calidad regulatoria',
		unit: 'wgi',
		better: 'up',
		fetch: wb('GOV_WGI_RQ.EST', 3),
		via: 'wgi'
	},
	{
		id: 'wgi_pv',
		label: 'Estabilidad política y ausencia de violencia',
		unit: 'wgi',
		better: 'up',
		fetch: wb('GOV_WGI_PV.EST', 3),
		via: 'wgi'
	},
	{
		id: 'wgi_va',
		label: 'Voz y rendición de cuentas',
		unit: 'wgi',
		better: 'up',
		fetch: wb('GOV_WGI_VA.EST', 3),
		via: 'wgi'
	},
	// 20 · Poder estratégico
	{
		id: 'mil_gdp',
		label: 'Gasto militar',
		unit: 'pct',
		decimals: 2,
		fetch: wb('MS.MIL.XPND.GD.ZS'),
		via: 'wb',
		origin: 'SIPRI',
		hint: '% del PIB'
	},
	{
		id: 'mil_usd',
		label: 'Gasto militar (US$)',
		unit: 'usd',
		fetch: wb('MS.MIL.XPND.CD'),
		via: 'wb',
		origin: 'SIPRI'
	},
	{
		id: 'reserves',
		label: 'Reservas internacionales (incluye oro)',
		unit: 'usd',
		fetch: wb('FI.RES.TOTL.CD'),
		via: 'wb'
	},
	{
		id: 'reserves_months',
		label: 'Reservas en meses de importaciones',
		unit: 'months',
		better: 'up',
		fetch: wb('FI.RES.TOTL.MO'),
		via: 'wb'
	},
	{
		id: 'rnd',
		label: 'Gasto en investigación y desarrollo',
		unit: 'pct',
		decimals: 2,
		better: 'up',
		fetch: wb('GB.XPD.RSDV.GD.ZS'),
		via: 'wb',
		hint: '% del PIB'
	},
	{
		id: 'energy_imports',
		label: 'Importaciones netas de energía',
		unit: 'pct',
		signed: true,
		better: 'down',
		fetch: wb('EG.IMP.CONS.ZS'),
		via: 'wb',
		hint: '% del uso de energía · negativo = exportador neto'
	},
	{
		id: 'hightech',
		label: 'Exportaciones de alta tecnología',
		unit: 'pct',
		better: 'up',
		fetch: wb('TX.VAL.TECH.MF.ZS'),
		via: 'wb',
		hint: '% de las exportaciones manufactureras'
	}
];

export const INDICATORS: IndicatorDef[] = [
	{
		n: 1,
		slug: 'poblacion',
		title: 'Población total',
		group: 'economia',
		summary:
			'Cuántas personas viven en el país. Ayuda a medir el tamaño del mercado, la fuerza laboral y el peso demográfico.',
		metrics: ['pop', 'pop_growth', 'urban'],
		headline: 'pop'
	},
	{
		n: 2,
		slug: 'densidad',
		title: 'Densidad poblacional',
		group: 'economia',
		summary:
			'Habitantes por km². Permite estudiar la concentración urbana, la presión sobre la vivienda y los costos de infraestructura.',
		metrics: ['density', 'land', 'urban'],
		headline: 'density',
		note: 'La densidad nacional promedia zonas despobladas con grandes ciudades; léela junto con el porcentaje urbano.'
	},
	{
		n: 3,
		slug: 'pib',
		title: 'PIB nominal total',
		group: 'economia',
		summary:
			'Valor monetario de los bienes y servicios producidos durante un año, a precios corrientes y tipos de cambio de mercado.',
		metrics: ['gdp', 'gdp_imf'],
		headline: 'gdp',
		note: 'Al estar en dólares corrientes, una depreciación fuerte reduce el PIB medido aunque la producción real no caiga.'
	},
	{
		n: 4,
		slug: 'pib-per-capita-ppa',
		title: 'PIB per cápita ajustado por PPA',
		group: 'economia',
		summary:
			'PIB por habitante considerando las diferencias en el costo de vida. Sirve para comparar el poder adquisitivo promedio entre países.',
		metrics: ['gdppc_ppp', 'gdppc_usd', 'gdppc_ppp_imf'],
		headline: 'gdppc_ppp'
	},
	{
		n: 5,
		slug: 'crecimiento',
		title: 'Crecimiento real del PIB',
		group: 'economia',
		summary:
			'Variación anual de la economía descontando la inflación. Distingue entre economías que crecen, se estancan o se contraen.',
		metrics: ['growth', 'growth_imf'],
		headline: 'growth'
	},
	{
		n: 6,
		slug: 'inflacion',
		title: 'Inflación anual',
		group: 'economia',
		summary:
			'Aumento porcentual de los precios. Afecta los salarios reales, el ahorro, el consumo y el costo de vida.',
		metrics: ['inflation', 'inflation_imf'],
		headline: 'inflation'
	},
	{
		n: 7,
		slug: 'tipo-de-cambio',
		title: 'Tipo de cambio frente al dólar, euro y yuan',
		group: 'economia',
		summary:
			'Valor de la moneda local frente a las tres divisas, con su variación anual. Se distingue entre tipo de cambio nominal y real.',
		metrics: ['fx_official', 'fx_dep', 'reer', 'ppp_factor'],
		headline: 'fx_dep',
		widget: 'fx',
		note: 'El tipo de cambio nominal dice cuántas unidades locales cuesta una divisa; el real (efectivo) ajusta por inflación relativa frente a los socios comerciales. El Banco Mundial solo publica el real para algunos países.'
	},
	{
		n: 8,
		slug: 'composicion-del-pib',
		title: 'Composición del PIB por industria',
		group: 'economia',
		summary:
			'Participación de agricultura, manufactura, servicios, tecnología, construcción, minería y energía. Revela de dónde proviene la producción nacional.',
		metrics: [
			'agri',
			'industry',
			'manuf',
			'services',
			'rents_oil',
			'rents_gas',
			'rents_min',
			'ict_exports'
		],
		headline: 'services',
		widget: 'composition',
		note: 'Las rentas de recursos naturales miden la ganancia extraordinaria de explotar petróleo, gas y minerales; no son lo mismo que el valor agregado del sector, pero indican la dependencia extractiva.',
		gaps: [
			'Construcción, minería, energía y tecnología como % del PIB por separado: las cuentas nacionales de cada país los publican, pero ninguna API internacional abierta los homologa para toda la región.'
		]
	},
	{
		n: 9,
		slug: 'comercio-exterior',
		title: 'Exportaciones e importaciones',
		group: 'economia',
		summary:
			'Valor de las ventas y compras internacionales y sus principales socios comerciales. Ayuda a identificar dependencias económicas y ventajas productivas.',
		metrics: ['exports', 'imports', 'trade_balance', 'trade_open', 'fdi'],
		headline: 'trade_open',
		widget: 'trade'
	},
	{
		n: 10,
		slug: 'riqueza-nacional',
		title: 'Riqueza nacional neta',
		group: 'economia',
		summary:
			'Valor de los activos menos los pasivos correspondientes. Complementa al PIB porque mide el patrimonio acumulado, no solo la producción anual.',
		metrics: ['wealth', 'wealth_pc', 'wealth_gdp', 'nfa'],
		headline: 'wealth_pc',
		note: 'La "riqueza integral" del Banco Mundial suma capital producido, capital natural (bosques, tierras, minerales, energía), capital humano y activos externos netos. Es la medida comparable más amplia con API abierta; se actualiza cada varios años.',
		gaps: [
			'Balance patrimonial financiero de los hogares (activos − pasivos): la World Inequality Database lo estima, pero su API no es abierta.'
		]
	},
	{
		n: 11,
		slug: 'salarios',
		title: 'Salario mínimo y salario mediano',
		group: 'bienestar',
		summary:
			'Ambos en moneda local, en dólares y ajustados por PPA. El salario mediano refleja mejor al trabajador típico que el promedio.',
		metrics: [
			'minwage_lcu',
			'minwage_usd',
			'minwage_ppp',
			'medwage_lcu',
			'medwage_usd',
			'medwage_ppp',
			'kaitz',
			'unemployment'
		],
		headline: 'minwage_ppp',
		widget: 'wages',
		note: 'El salario mediano de la OIT proviene de encuestas de hogares y cubre a los asalariados; con alta informalidad, buena parte de la fuerza laboral queda fuera.'
	},
	{
		n: 12,
		slug: 'costo-de-vida',
		title: 'Costo de vida y vivienda',
		group: 'bienestar',
		summary:
			'Precio de una canasta comparable, renta, compra de vivienda y proporción del ingreso destinada a ella. Mide cuánto rinde realmente un salario.',
		metrics: ['price_level', 'house_real', 'house_real_yoy', 'inflation'],
		headline: 'price_level',
		note: 'El nivel de precios relativo sale del Programa de Comparación Internacional (PPA): compara el costo de la misma canasta en cada país contra EE. UU. El BIS solo publica precios de vivienda para Brasil, Chile, Colombia, México y Perú.',
		gaps: [
			'Renta mensual, precio por m² y proporción del ingreso destinada a vivienda: solo existen en fuentes comerciales (Numbeo, portales inmobiliarios) o en la OCDE para sus 4 miembros latinoamericanos.'
		]
	},
	{
		n: 13,
		slug: 'pobreza',
		title: 'Índice de pobreza',
		group: 'bienestar',
		summary:
			'Porcentaje de la población bajo el umbral nacional de pobreza y, por separado, bajo una línea internacional comparable. Los dos miden realidades diferentes.',
		metrics: ['pov_nat', 'pov_300', 'pov_830'],
		headline: 'pov_830',
		note: 'Las líneas nacionales no son comparables entre países. Para comparar, usa las internacionales: US$ 3.00/día (pobreza extrema) y US$ 8.30/día (referencia para países de ingreso medio-alto, como la mayoría de la región).'
	},
	{
		n: 14,
		slug: 'desigualdad',
		title: 'Desigualdad de ingresos y riqueza',
		group: 'bienestar',
		summary:
			'Coeficiente de Gini y participación del 10 % más rico. Dos países igual de ricos pueden distribuir sus recursos de forma muy distinta.',
		metrics: ['gini', 'top10_income', 'bottom20_income', 'top10_wid'],
		headline: 'gini',
		note: 'Las encuestas de hogares subestiman los ingresos más altos; por eso la estimación de WID (que incorpora datos fiscales) suele mostrar una concentración mucho mayor.',
		gaps: [
			'Participación del 10 % más rico en el patrimonio: la publica WID, pero no tiene API pública abierta.'
		]
	},
	{
		n: 15,
		slug: 'salud',
		title: 'Esperanza de vida y mortalidad',
		group: 'bienestar',
		summary:
			'Esperanza de vida al nacer, mortalidad infantil y acceso a servicios sanitarios. Contrasta la riqueza económica con los resultados de salud.',
		metrics: ['life_exp', 'infant_mort', 'health_exp', 'oop'],
		headline: 'life_exp'
	},
	{
		n: 16,
		slug: 'educacion',
		title: 'Educación y desarrollo humano',
		group: 'bienestar',
		summary:
			'Años promedio de escolaridad, resultados educativos e Índice de Desarrollo Humano. Ayuda a estudiar el capital humano y las oportunidades a largo plazo.',
		metrics: ['hdi', 'schooling', 'lays', 'edu_exp', 'tertiary'],
		headline: 'hdi'
	},
	{
		n: 17,
		slug: 'felicidad',
		title: 'Índice de felicidad o satisfacción vital',
		group: 'bienestar',
		summary:
			'Cómo califican las personas su propia vida. Es subjetivo y complementa los datos materiales; no es una medida puramente económica.',
		metrics: ['happiness'],
		headline: 'happiness',
		note: 'Se basa en la pregunta de la escalera de Cantril de la encuesta Gallup (≈1,000 personas por país y año); el World Happiness Report publica promedios trianuales.'
	},
	{
		n: 18,
		slug: 'finanzas-publicas',
		title: 'Finanzas públicas y deuda',
		group: 'poder',
		summary:
			'Deuda pública, déficit o superávit, ingresos tributarios y gasto. Mide la capacidad del Estado para financiar servicios y responder a crisis.',
		metrics: ['debt', 'fiscal_balance', 'revenue', 'spending', 'tax'],
		headline: 'debt',
		note: 'La deuda y el balance vienen del World Economic Outlook del FMI (gobierno general, con proyecciones para el año en curso). Ingresos y gasto vienen de la base histórica de finanzas públicas del FMI, cuya cobertura institucional varía por país.'
	},
	{
		n: 19,
		slug: 'instituciones',
		title: 'Calidad institucional y corrupción',
		group: 'poder',
		summary:
			'Estado de derecho, eficacia gubernamental, control de la corrupción y calidad regulatoria. Son aproximaciones, no mediciones perfectas.',
		metrics: ['cpi', 'wgi_rl', 'wgi_ge', 'wgi_cc', 'wgi_rq', 'wgi_pv', 'wgi_va'],
		headline: 'wgi_rl',
		note: 'Los indicadores de gobernanza del Banco Mundial van de ≈ −2.5 (débil) a +2.5 (fuerte) y agregan decenas de encuestas y evaluaciones de expertos; sus márgenes de error son amplios.'
	},
	{
		n: 20,
		slug: 'poder-estrategico',
		title: 'Poder estratégico internacional',
		group: 'poder',
		summary:
			'Gasto militar, dependencia energética, reservas internacionales, I+D y posición en cadenas estratégicas. Se muestra desglosado para no ocultar diferencias.',
		metrics: [
			'mil_gdp',
			'mil_usd',
			'reserves',
			'reserves_months',
			'rnd',
			'energy_imports',
			'hightech'
		],
		headline: 'reserves_months',
		note: 'A propósito no se calcula un índice compuesto: sumar componentes tan distintos ocultaría más de lo que revela.',
		gaps: [
			'Posición en cadenas de suministro estratégicas (semiconductores, litio, tierras raras): no hay una serie homologada; las exportaciones de alta tecnología son la mejor aproximación abierta.'
		]
	}
];

/** Encabezados cortos para la matriz regional (métrica principal de cada indicador). */
export const SHORT_TITLE: Record<string, string> = {
	poblacion: 'Población',
	densidad: 'Hab/km²',
	pib: 'PIB US$',
	'pib-per-capita-ppa': 'PIB pc PPA',
	crecimiento: 'Crecim.',
	inflacion: 'Inflación',
	'tipo-de-cambio': 'Deprec. vs US$',
	'composicion-del-pib': 'Servicios % PIB',
	'comercio-exterior': 'Apertura % PIB',
	'riqueza-nacional': 'Riqueza pc',
	salarios: 'Mínimo US$ PPA',
	'costo-de-vida': 'Nivel precios',
	pobreza: 'Pobreza $8.30',
	desigualdad: 'Gini',
	salud: 'Esp. vida',
	educacion: 'IDH',
	felicidad: 'Felicidad',
	'finanzas-publicas': 'Deuda % PIB',
	instituciones: 'Estado de derecho',
	'poder-estrategico': 'Reservas (meses)'
};

export const METRIC_BY_ID = new Map(METRICS.map((m) => [m.id, m]));
export const INDICATOR_BY_SLUG = new Map(INDICATORS.map((i) => [i.slug, i]));

export function getMetricDef(id: string): MetricDef {
	const def = METRIC_BY_ID.get(id);
	if (!def) throw new Error(`Métrica desconocida: ${id}`);
	return def;
}

/** Las cifras en moneda local no se pueden ordenar ni promediar entre países. */
export function isComparable(def: Pick<MetricDef, 'unit'>): boolean {
	return def.unit !== 'lcu_per_usd' && def.unit !== 'lcu_per_intl' && def.unit !== 'lcu_month';
}

export function sourceLabel(def: MetricDef): string {
	const via = SOURCES[def.via].short;
	return def.origin ? `${def.origin} · vía ${via}` : via;
}
