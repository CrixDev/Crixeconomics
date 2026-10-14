import { describe, expect, it } from 'vitest';
import { getMetricDef } from './indicators';
import {
	currentProjection,
	latestObserved,
	median,
	medianSeries,
	rankPeers,
	snapshot
} from './stats';
import type { Point } from './types';

const p = (t: number, value: number, projected?: boolean): Point => ({
	t,
	label: String(t),
	value,
	projected
});

describe('latestObserved / currentProjection', () => {
	const series = [p(2023, 1), p(2024, 2), p(2025, 3), p(2026, 4, true), p(2027, 5, true)];

	it('ignora las proyecciones al tomar el último dato', () => {
		expect(latestObserved(series)?.t).toBe(2025);
	});

	it('devuelve la proyección del año en curso', () => {
		expect(currentProjection(series, 2026)?.value).toBe(4);
		expect(currentProjection(series, 2030)).toBeNull();
	});
});

describe('median', () => {
	it('funciona con cantidades pares e impares', () => {
		expect(median([3, 1, 2])).toBe(2);
		expect(median([4, 1, 3, 2])).toBe(2.5);
		expect(median([])).toBeNull();
	});
});

describe('rankPeers', () => {
	const byCountry = {
		MEX: [p(2024, 5)],
		BRA: [p(2024, 3)],
		ARG: [p(2024, 9)],
		VEN: [p(2010, 1)] // fuera de la ventana de comparación
	};

	it('ordena del mejor al peor según la dirección', () => {
		expect(rankPeers(byCountry, { better: 'down' }, 2026).map((x) => x.iso3)).toEqual([
			'BRA',
			'MEX',
			'ARG'
		]);
		expect(rankPeers(byCountry, { better: 'up' }, 2026).map((x) => x.iso3)).toEqual([
			'ARG',
			'MEX',
			'BRA'
		]);
	});

	it('excluye datos demasiado viejos', () => {
		expect(rankPeers(byCountry, {}, 2026).some((x) => x.iso3 === 'VEN')).toBe(false);
	});
});

describe('medianSeries', () => {
	it('solo publica años con al menos 5 países', () => {
		const byCountry = Object.fromEntries(
			['A', 'B', 'C', 'D', 'E'].map((k, i) => [k, [p(2020, i), ...(i < 2 ? [p(2021, i)] : [])]])
		);
		expect(medianSeries(byCountry)).toEqual([{ t: 2020, label: '2020', value: 2 }]);
	});
});

describe('snapshot', () => {
	it('no ordena ni promedia métricas en moneda local', () => {
		const snap = snapshot(
			getMetricDef('fx_official'),
			{ MEX: [p(2025, 19)], ARG: [p(2025, 1000)] },
			'MEX',
			undefined,
			2026
		);
		expect(snap.rank).toBeNull();
		expect(snap.median).toBeNull();
		expect(snap.latest?.value).toBe(19);
	});

	it('calcula posición y puntaje en métricas comparables', () => {
		const snap = snapshot(
			getMetricDef('inflation'),
			{ MEX: [p(2025, 4)], ARG: [p(2025, 100)], CHL: [p(2025, 3)] },
			'MEX',
			undefined,
			2026
		);
		expect(snap.rank).toBe(2);
		expect(snap.ranked).toBe(3);
		expect(snap.score).toBe(0.5);
	});
});
