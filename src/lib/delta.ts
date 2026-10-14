import { num } from './format';
import type { MetricDef, Unit } from './indicators';
import type { Point } from './types';

/** Unidades donde la variación se lee mejor como diferencia absoluta (p. ej. puntos porcentuales). */
const ABSOLUTE: Unit[] = [
	'pct',
	'wgi',
	'score10',
	'score100',
	'hdi',
	'ratio',
	'years',
	'per_1000',
	'months',
	'times'
];

export type Delta = { text: string; tone: 'good' | 'bad' | 'neutral'; versus: string };

/** Variación frente al mismo periodo del año anterior. */
export function yearOverYear(series: Point[], latest: Point | null, def: MetricDef): Delta | null {
	if (!latest) return null;
	const prev = series.find((p) => !p.projected && Math.abs(p.t - (latest.t - 1)) < 1e-9);
	if (!prev) return null;

	const absolute = ABSOLUTE.includes(def.unit);
	let change: number;
	let text: string;
	if (absolute) {
		change = latest.value - prev.value;
		const d = def.unit === 'hdi' ? 3 : def.unit === 'score100' ? 1 : 2;
		text = `${num(change, def.unit === 'pct' ? 1 : d, true)}${def.unit === 'pct' ? ' pp' : ''}`;
	} else {
		if (!prev.value) return null;
		change = (latest.value / prev.value - 1) * 100;
		text = `${num(change, 1, true)} %`;
	}

	let tone: Delta['tone'] = 'neutral';
	if (def.better && Math.abs(change) > 1e-9) {
		tone = change > 0 === (def.better === 'up') ? 'good' : 'bad';
	}
	return { text, tone, versus: prev.label };
}
