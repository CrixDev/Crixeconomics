import { getCountry } from '$lib/countries';
import type { FxQuote, FxView } from '$lib/types';
import { cached, HOUR } from '../cache';
import { getJson } from '../http';

type UsdTable = { date: string; usd: Record<string, number> };

const DAY = 24 * HOUR;

/** Tipos de cambio diarios por fecha (YYYY-MM-DD o "latest"), con espejo de respaldo. */
function usdTable(date: string): Promise<UsdTable> {
	const ttl = date === 'latest' ? 6 * HOUR : 30 * DAY;
	return cached(`fx:${date}`, ttl, async () => {
		const urls = [
			`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/usd.json`,
			`https://${date}.currency-api.pages.dev/v1/currencies/usd.json`
		];
		let lastError: unknown;
		for (const url of urls) {
			try {
				return await getJson<UsdTable>(url, { timeoutMs: 15_000, retries: 0 });
			} catch (error) {
				lastError = error;
			}
		}
		throw lastError;
	});
}

function isoDate(d: Date): string {
	return d.toISOString().slice(0, 10);
}

/** Fechas mensuales hacia atrás desde `from` (12 meses + el punto inicial). */
function monthlyDates(from: Date): string[] {
	const dates: string[] = [];
	for (let i = 12; i >= 1; i--) {
		const d = new Date(
			Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - i, Math.min(from.getUTCDate(), 28))
		);
		dates.push(isoDate(d));
	}
	return dates;
}

function localPer(table: UsdTable, currency: string, foreign: string): number | null {
	const local = currency === 'usd' ? 1 : table.usd[currency];
	const other = foreign === 'usd' ? 1 : table.usd[foreign];
	return local && other ? local / other : null;
}

export async function getFx(iso3: string): Promise<FxView | null> {
	const country = getCountry(iso3);
	if (!country) return null;
	const currency = country.currency.toLowerCase();

	const latest = await usdTable('latest');
	const today = new Date(`${latest.date}T00:00:00Z`);
	const dates = monthlyDates(today);
	const history = await Promise.all(dates.map((d) => usdTable(d).catch(() => null)));
	const yearAgo = history[0];

	const quotes: FxQuote[] = (['USD', 'EUR', 'CNY'] as const).map((code) => {
		const foreign = code.toLowerCase();
		const rate = localPer(latest, currency, foreign) ?? NaN;
		const prev = yearAgo ? localPer(yearAgo, currency, foreign) : null;
		const points = history
			.map((t) => (t ? { date: t.date, rate: localPer(t, currency, foreign) } : null))
			.filter((p): p is { date: string; rate: number } => p?.rate != null);
		points.push({ date: latest.date, rate });
		return {
			code,
			rate,
			yearAgo: prev,
			// + = la moneda local se apreció (cuesta menos comprar la divisa).
			change: prev && Number.isFinite(rate) ? (prev / rate - 1) * 100 : null,
			history: points
		};
	});

	return {
		date: latest.date,
		yearAgoDate: yearAgo?.date ?? dates[0],
		currency: country.currency,
		quotes: quotes.filter((q) => Number.isFinite(q.rate))
	};
}
