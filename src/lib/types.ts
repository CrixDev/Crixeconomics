/** Una observación. `t` es el año (fraccional para datos trimestrales). */
export type Point = { t: number; label: string; value: number; projected?: boolean };

/** Serie de una métrica para los 20 países. */
export type RegionSeries = {
	id: string;
	byCountry: Record<string, Point[]>;
	error?: string;
};

export type Peer = { iso3: string; value: number; label: string };

export type MetricSnapshot = {
	id: string;
	series: Point[];
	/** Último dato observado (no proyectado). */
	latest: Point | null;
	/** Proyección del año en curso (solo FMI). */
	projection: Point | null;
	/** Posición entre los países con dato comparable (1 = mejor o mayor). */
	rank: number | null;
	ranked: number;
	median: number | null;
	/** 0 = peor de la región, 1 = mejor (o menor/mayor si la métrica es neutral). */
	score: number | null;
	peers: Peer[];
	medianSeries: Point[];
	stale: boolean;
	error?: string;
};

export type IndicatorView = {
	slug: string;
	metrics: MetricSnapshot[];
};

export type FxQuote = {
	code: 'USD' | 'EUR' | 'CNY';
	/** Unidades de moneda local por 1 unidad de la divisa. */
	rate: number;
	yearAgo: number | null;
	/** Variación % de la moneda local frente a la divisa (+ = se apreció). */
	change: number | null;
	history: { date: string; rate: number }[];
};

export type FxView = {
	date: string;
	yearAgoDate: string;
	currency: string;
	quotes: FxQuote[];
};

export type TradePartner = { iso2: string | null; name: string; value: number; share: number };

export type TradeView = {
	year: number;
	exportsTotal: number;
	importsTotal: number;
	exports: TradePartner[];
	imports: TradePartner[];
};

export type MatrixCell = { value: number; label: string; score: number | null } | null;

export type MatrixRow = { iso3: string; cells: Record<string, MatrixCell> };

export type ChartSeries = {
	key: string;
	label: string;
	color: string;
	points: Point[];
	dashed?: boolean;
	width?: number;
	/** Serie de fondo: no aparece en el tooltip. */
	quiet?: boolean;
};
