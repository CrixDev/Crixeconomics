/** Marcas "redondas" para un eje entre min y max. */
export function niceTicks(min: number, max: number, count = 5): number[] {
	if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
	if (min === max) return [min];
	const raw = (max - min) / count;
	const mag = 10 ** Math.floor(Math.log10(raw));
	const err = raw / mag;
	const step = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * mag;
	const start = Math.floor(min / step) * step;
	const end = Math.ceil(max / step) * step;
	const ticks: number[] = [];
	for (let v = start; v <= end + step / 2; v += step) ticks.push(Number(v.toPrecision(12)));
	return ticks;
}

/** Años enteros para el eje X, espaciados para no amontonarse. */
export function yearTicks(t0: number, t1: number, maxTicks = 7): number[] {
	const first = Math.ceil(t0);
	const last = Math.floor(t1);
	const span = last - first;
	if (span < 0) return [];
	const steps = [1, 2, 5, 10, 20];
	const step = steps.find((s) => span / s <= maxTicks) ?? 25;
	const ticks: number[] = [];
	for (let y = Math.ceil(first / step) * step; y <= last; y += step) ticks.push(y);
	return ticks;
}
