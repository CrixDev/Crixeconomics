<script lang="ts">
	import type { Point } from '$lib/types';

	let {
		points,
		reference = [],
		height = 44,
		label = ''
	}: {
		points: Point[];
		/** Serie de comparación (p. ej. mediana regional), en gris. */
		reference?: Point[];
		height?: number;
		label?: string;
	} = $props();

	const pad = 4;
	let width = $state(0);

	const domain = $derived.by(() => {
		const start = points[0]?.t ?? -Infinity;
		const all = [...points, ...reference.filter((p) => p.t >= start)];
		if (!all.length) return null;
		const ts = all.map((p) => p.t);
		const vs = all.map((p) => p.value);
		let [y0, y1] = [Math.min(...vs), Math.max(...vs)];
		if (y0 === y1) [y0, y1] = [y0 - 1, y1 + 1];
		return { t0: Math.min(...ts), t1: Math.max(...ts), y0, y1 };
	});

	function x(t: number) {
		if (!domain) return 0;
		const span = domain.t1 - domain.t0 || 1;
		return pad + ((t - domain.t0) / span) * (width - pad * 2);
	}
	function y(v: number) {
		if (!domain) return 0;
		return height - pad - ((v - domain.y0) / (domain.y1 - domain.y0)) * (height - pad * 2);
	}
	function path(pts: Point[]) {
		return pts
			.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.value).toFixed(1)}`)
			.join('');
	}

	const observed = $derived(points.filter((p) => !p.projected));
	const projected = $derived.by(() => {
		const proj = points.filter((p) => p.projected);
		const last = observed.at(-1);
		return proj.length && last ? [last, ...proj] : proj;
	});
	const ref = $derived(domain ? reference.filter((p) => p.t >= domain.t0 && p.t <= domain.t1) : []);
	const end = $derived(observed.at(-1));
	const zero = $derived(domain && domain.y0 < 0 && domain.y1 > 0 ? y(0) : null);
</script>

<div class="wrap" bind:clientWidth={width} style:height="{height}px">
	{#if domain && points.length > 1 && width > 0}
		<svg viewBox="0 0 {width} {height}" {width} {height} role="img" aria-label={label}>
			{#if zero != null}
				<line x1={pad} x2={width - pad} y1={zero} y2={zero} class="zero" />
			{/if}
			{#if ref.length > 1}
				<path d={path(ref)} class="ref" />
			{/if}
			<path d={path(observed)} class="line" />
			{#if projected.length > 1}
				<path d={path(projected)} class="line proj" />
			{/if}
			{#if end}
				<circle cx={x(end.t)} cy={y(end.value)} r="2.6" class="dot" />
			{/if}
		</svg>
	{/if}
</div>

<style>
	.wrap {
		width: 100%;
		min-width: 0;
	}
	svg {
		display: block;
		overflow: visible;
	}
	path {
		fill: none;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.line {
		stroke: var(--accent);
		stroke-width: 1.75;
	}
	.proj {
		stroke-dasharray: 3 3;
		opacity: 0.8;
	}
	.ref {
		stroke: var(--rule-strong);
		stroke-width: 1.25;
	}
	.zero {
		stroke: var(--rule);
		stroke-width: 1;
	}
	.dot {
		fill: var(--accent);
	}
</style>
