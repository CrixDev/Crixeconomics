/** Color de fondo para un puntaje 0 (peor) – 1 (mejor) dentro de la región. */
export function heat(score: number | null, neutral = false): { bg: string; ink: string } {
	if (score == null) return { bg: 'transparent', ink: 'var(--muted)' };
	if (neutral) {
		const p = Math.round(score * 100);
		return {
			bg: `color-mix(in oklab, var(--neutral-1) ${p}%, var(--neutral-0))`,
			ink: score > 0.62 ? 'var(--heat-ink-strong)' : 'var(--ink)'
		};
	}
	const segments = 4;
	const x = score * segments;
	const i = Math.min(Math.floor(x), segments - 1);
	const f = Math.round((x - i) * 100);
	return {
		bg: `color-mix(in oklab, var(--heat-${i + 1}) ${f}%, var(--heat-${i}))`,
		ink: score < 0.14 || score > 0.86 ? 'var(--heat-ink-strong)' : 'var(--ink)'
	};
}
