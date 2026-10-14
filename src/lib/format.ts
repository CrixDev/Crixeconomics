import type { MetricDef, Unit } from './indicators';

const LOCALE = 'es-MX';
const MINUS = '−';

const formatters = new Map<number, Intl.NumberFormat>();
function nf(decimals: number): Intl.NumberFormat {
	let f = formatters.get(decimals);
	if (!f) {
		f = new Intl.NumberFormat(LOCALE, {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals
		});
		formatters.set(decimals, f);
	}
	return f;
}

/** Número con separadores es-MX y signo menos tipográfico. */
export function num(value: number, decimals = 0, signed = false): string {
	const text = nf(decimals).format(Math.abs(value));
	if (value < 0 && Number(text.replace(/,/g, '')) !== 0) return MINUS + text;
	return signed && value > 0 ? `+${text}` : text;
}

/**
 * Cantidades grandes en la convención hispana: "billón" = 10¹².
 * `short` usa abreviaturas para tablas.
 */
export function compact(value: number, short = false, signed = false): string {
	const abs = Math.abs(value);
	const sign = value < 0 ? MINUS : signed && value > 0 ? '+' : '';
	if (abs >= 1e12) return `${sign}${num(abs / 1e12, 2)}${short ? ' bill.' : ' billones'}`;
	if (abs >= 1e9)
		return `${sign}${num(abs / 1e9, abs >= 1e11 ? 0 : 1)}${short ? ' mil M' : ' mil millones'}`;
	if (abs >= 1e6) return `${sign}${num(abs / 1e6, 1)}${short ? ' M' : ' millones'}`;
	if (abs >= 1e4) return `${sign}${num(abs / 1e3, 1)} mil`;
	return `${sign}${num(abs, 0)}`;
}

const DEFAULT_DECIMALS: Partial<Record<Unit, number>> = {
	pct: 1,
	per_km2: 1,
	years: 1,
	per_1000: 1,
	index: 1,
	score10: 2,
	score100: 0,
	wgi: 2,
	hdi: 3,
	lcu_per_usd: 2,
	lcu_per_intl: 2,
	ratio: 2,
	months: 1,
	times: 1
};

type FormatOptions = { currency?: string; short?: boolean };

/** Valor con su unidad, listo para mostrar. */
export function formatValue(
	value: number | null | undefined,
	def: Pick<MetricDef, 'unit' | 'decimals' | 'signed'>,
	opts: FormatOptions = {}
): string {
	if (value == null || !Number.isFinite(value)) return '—';
	const d = def.decimals ?? DEFAULT_DECIMALS[def.unit] ?? 0;
	const s = def.signed ?? false;
	const cur = opts.currency ?? 'moneda local';
	const short = opts.short ?? false;

	switch (def.unit) {
		case 'people':
			return compact(value, short);
		case 'usd':
			return `US$ ${compact(value, short, s)}`.replace(`US$ ${MINUS}`, `${MINUS}US$ `);
		case 'intl':
			return short ? `${num(value, 0)}` : `US$ ${num(value, 0)} PPA`;
		case 'pct':
			return `${num(value, d, s)} %`;
		case 'per_km2':
			return short ? num(value, d) : `${num(value, d)} hab/km²`;
		case 'km2':
			return `${compact(value, short)} km²`;
		case 'years':
			return short ? num(value, d) : `${num(value, d)} años`;
		case 'per_1000':
			return short ? num(value, d) : `${num(value, d)} por 1,000`;
		case 'score10':
			return short ? num(value, d) : `${num(value, d)} / 10`;
		case 'score100':
			return short ? num(value, d) : `${num(value, d)} / 100`;
		case 'wgi':
			return num(value, d, true);
		case 'hdi':
		case 'index':
		case 'ratio':
			return num(value, d, s);
		case 'lcu_per_usd':
		case 'lcu_per_intl':
			return short ? num(value, d) : `${num(value, d)} ${cur}`;
		case 'months':
			return short ? num(value, d) : `${num(value, d)} meses`;
		case 'usd_month':
			return short ? num(value, 0) : `US$ ${num(value, 0)}`;
		case 'ppp_month':
			return short ? num(value, 0) : `US$ ${num(value, 0)} PPA`;
		case 'lcu_month':
			return `${num(value, 0)} ${cur}`;
		case 'times':
			return `${num(value, d)}×`;
	}
}

/** Unidad corta para encabezados de tabla. */
export function unitSuffix(unit: Unit): string {
	switch (unit) {
		case 'people':
			return 'personas';
		case 'usd':
			return 'US$';
		case 'intl':
		case 'ppp_month':
			return 'US$ PPA';
		case 'usd_month':
			return 'US$/mes';
		case 'pct':
			return '%';
		case 'per_km2':
			return 'hab/km²';
		case 'km2':
			return 'km²';
		case 'years':
			return 'años';
		case 'per_1000':
			return 'por 1,000';
		case 'score10':
			return '0–10';
		case 'score100':
			return '0–100';
		case 'wgi':
			return '−2.5 a 2.5';
		case 'hdi':
			return '0–1';
		case 'months':
			return 'meses';
		default:
			return '';
	}
}

export function ordinal(n: number): string {
	return `${n}.º`;
}

export function formatDate(iso: string): string {
	return new Date(`${iso}T12:00:00Z`).toLocaleDateString(LOCALE, {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}
