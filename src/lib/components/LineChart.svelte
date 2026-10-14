<script lang="ts">
	import { niceTicks, yearTicks } from '$lib/scale';
	import type { ChartSeries, Point } from '$lib/types';

	let {
		series,
		format,
		height = 280
	}: { series: ChartSeries[]; format: (v: number) => string; height?: number } = $props();

	const m = { top: 12, right: 16, bottom: 26, left: 64 };
	let width = $state(0);
	let hoverT = $state<number | null>(null);

	const all = $derived(series.flatMap((s) => s.points));

	const domain = $derived.by(() => {
		if (!all.length) return null;
		const ts = all.map((p) => p.t);
		const vs = all.map((p) => p.value);
		let [y0, y1] = [Math.min(...vs), Math.max(...vs)];
		if (y0 > 0 && y0 / (y1 || 1) < 0.35) y0 = 0;
		if (y0 === y1) [y0, y1] = [y0 - 1, y1 + 1];
		const ticks = niceTicks(y0, y1, 5);
		return { t0: Math.min(...ts), t1: Math.max(...ts), y0: ticks[0], y1: ticks.at(-1)!, ticks };
	});

	const innerW = $derived(Math.max(0, width - m.left - m.right));
	const innerH = $derived(height - m.top - m.bottom);

	function x(t: number) {
		if (!domain) return 0;
		return m.left + ((t - domain.t0) / (domain.t1 - domain.t0 || 1)) * innerW;
	}
	function y(v: number) {
		if (!domain) return 0;
		return m.top + innerH - ((v - domain.y0) / (domain.y1 - domain.y0 || 1)) * innerH;
	}
	function segments(points: Point[]): { d: string; projected: boolean }[] {
		const observed = points.filter((p) => !p.projected);
		const proj = points.filter((p) => p.projected);
		const line = (pts: Point[]) =>
			pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
		const out = [{ d: line(observed), projected: false }];
		if (proj.length) {
			const last = observed.at(-1);
			out.push({ d: line(last ? [last, ...proj] : proj), projected: true });
		}
		return out;
	}

	const ts = $derived([...new Set(all.map((p) => p.t))].sort((a, b) => a - b));

	function onMove(event: PointerEvent) {
		if (!domain || !ts.length) return;
		const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
		const px = event.clientX - rect.left;
		const t = domain.t0 + ((px - m.left) / (innerW || 1)) * (domain.t1 - domain.t0);
		hoverT = ts.reduce((best, cur) => (Math.abs(cur - t) < Math.abs(best - t) ? cur : best), ts[0]);
	}

	const hoverRows = $derived(
		hoverT == null
			? []
			: series
					.filter((s) => !s.quiet)
					.map((s) => ({ s, p: s.points.find((p) => p.t === hoverT) }))
					.filter((r): r is { s: ChartSeries; p: Point } => r.p != null)
					.sort((a, b) => b.p.value - a.p.value)
	);
	const hoverLabel = $derived(hoverRows[0]?.p.label ?? '');
	const tooltipLeft = $derived(hoverT == null ? 0 : x(hoverT));
</script>

<div class="chart" bind:clientWidth={width} style:height="{height}px">
	{#if domain && width > 0}
		<svg
			{width}
			{height}
			viewBox="0 0 {width} {height}"
			role="img"
			aria-label="Gráfica de evolución"
			onpointermove={onMove}
			onpointerleave={() => (hoverT = null)}
		>
			{#each domain.ticks as tick (tick)}
				<line
					class="grid"
					class:zero={tick === 0}
					x1={m.left}
					x2={width - m.right}
					y1={y(tick)}
					y2={y(tick)}
				/>
				<text class="ylab" x={m.left - 8} y={y(tick)} dy="0.32em">{format(tick)}</text>
			{/each}
			{#each yearTicks(domain.t0, domain.t1, Math.max(3, Math.floor(innerW / 70))) as year (year)}
				<text class="xlab" x={x(year)} y={height - 6}>{year}</text>
			{/each}

			{#each series as s (s.key)}
				{#each segments(s.points) as seg, i (i)}
					<path
						d={seg.d}
						style:stroke={s.color}
						stroke-width={s.width ?? 2}
						stroke-dasharray={seg.projected || s.dashed ? '4 4' : undefined}
						class="series"
					/>
				{/each}
			{/each}

			{#if hoverT != null}
				<line class="cursor" x1={x(hoverT)} x2={x(hoverT)} y1={m.top} y2={m.top + innerH} />
				{#each hoverRows as r (r.s.key)}
					<circle
						cx={x(r.p.t)}
						cy={y(r.p.value)}
						r="3.5"
						style:fill={r.s.color}
						class="hover-dot"
					/>
				{/each}
			{/if}
		</svg>

		{#if hoverT != null && hoverRows.length}
			<div
				class="tooltip"
				class:flip={tooltipLeft > width * 0.6}
				style:left="{tooltipLeft}px"
				role="status"
			>
				<div class="tip-head num">{hoverLabel}</div>
				{#each hoverRows as r (r.s.key)}
					<div class="tip-row">
						<span class="swatch" style:background={r.s.color}></span>
						<span class="tip-name">{r.s.label}</span>
						<span class="num">{format(r.p.value)}{r.p.projected ? '*' : ''}</span>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.chart {
		position: relative;
		width: 100%;
		min-width: 0;
		touch-action: pan-y;
	}
	svg {
		display: block;
		overflow: visible;
	}
	.grid {
		stroke: var(--rule);
		stroke-width: 1;
	}
	.grid.zero {
		stroke: var(--rule-strong);
	}
	.ylab,
	.xlab {
		font-family: var(--font-mono);
		font-size: 10.5px;
		fill: var(--muted);
	}
	.ylab {
		text-anchor: end;
	}
	.xlab {
		text-anchor: middle;
	}
	.series {
		fill: none;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.cursor {
		stroke: var(--ink-2);
		stroke-width: 1;
		stroke-dasharray: 2 3;
	}
	.hover-dot {
		stroke: var(--surface);
		stroke-width: 2;
	}
	.tooltip {
		position: absolute;
		top: 8px;
		transform: translateX(12px);
		background: var(--surface);
		border: 1px solid var(--rule-strong);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow);
		padding: 8px 10px;
		font-size: 12px;
		pointer-events: none;
		min-width: 160px;
		max-width: 260px;
		z-index: 2;
	}
	.tooltip.flip {
		transform: translateX(calc(-100% - 12px));
	}
	.tip-head {
		color: var(--muted);
		font-size: 11px;
		margin-bottom: 4px;
	}
	.tip-row {
		display: grid;
		grid-template-columns: 10px 1fr auto;
		gap: 8px;
		align-items: center;
		line-height: 1.7;
	}
	.tip-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.swatch {
		width: 10px;
		height: 3px;
		border-radius: 2px;
	}
</style>
