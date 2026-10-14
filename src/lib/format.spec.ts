import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv';
import { yearOverYear } from './delta';
import { compact, formatValue, num } from './format';
import { getMetricDef } from './indicators';

describe('num / compact', () => {
	it('usa el signo menos tipográfico y evita "−0"', () => {
		expect(num(-1.25, 1)).toBe('−1.3');
		expect(num(-0.01, 1)).toBe('0.0');
		expect(num(2, 1, true)).toBe('+2.0');
	});

	it('usa la escala larga en español (billón = 10¹²)', () => {
		expect(compact(1.83e12)).toBe('1.83 billones');
		expect(compact(683e9)).toBe('683 mil millones');
		expect(compact(45.9e6)).toBe('45.9 millones');
		expect(compact(1.83e12, true)).toBe('1.83 bill.');
	});
});

describe('formatValue', () => {
	it('formatea según la unidad', () => {
		expect(formatValue(4.24, getMetricDef('inflation'))).toBe('4.2 %');
		expect(formatValue(2.1, getMetricDef('growth'))).toBe('+2.1 %');
		expect(formatValue(-0.52, getMetricDef('wgi_rl'))).toBe('−0.52');
		expect(formatValue(6467, getMetricDef('minwage_lcu'), { currency: 'MXN' })).toBe('6,467 MXN');
		expect(formatValue(-11.6e9, getMetricDef('trade_balance'))).toBe('−US$ 11.6 mil millones');
		expect(formatValue(null, getMetricDef('pop'))).toBe('—');
	});
});

describe('yearOverYear', () => {
	it('reporta puntos porcentuales para tasas y respeta la dirección', () => {
		const def = getMetricDef('inflation');
		const series = [
			{ t: 2024, label: '2024', value: 5 },
			{ t: 2025, label: '2025', value: 4 }
		];
		expect(yearOverYear(series, series[1], def)).toEqual({
			text: '−1.0 pp',
			tone: 'good',
			versus: '2024'
		});
	});

	it('reporta variación porcentual para niveles', () => {
		const def = getMetricDef('pop');
		const series = [
			{ t: 2024, label: '2024', value: 100 },
			{ t: 2025, label: '2025', value: 101 }
		];
		expect(yearOverYear(series, series[1], def)?.text).toBe('+1.0 %');
	});
});

describe('parseCsv', () => {
	it('respeta comas y comillas dentro de campos', () => {
		const rows = parseCsv(
			'entity,code\n"Bonaire, Sint Eustatius and Saba",BES\n"Dice ""hola""",X\r\n'
		);
		expect(rows).toEqual([
			['entity', 'code'],
			['Bonaire, Sint Eustatius and Saba', 'BES'],
			['Dice "hola"', 'X']
		]);
	});
});
