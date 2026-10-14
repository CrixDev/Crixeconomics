<script lang="ts">
	import { goto } from '$app/navigation';
	import Flag from '$lib/components/Flag.svelte';
	import LineChart from '$lib/components/LineChart.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import { COUNTRIES, getCountry } from '$lib/countries';
	import { formatValue, ordinal } from '$lib/format';
	import { GROUPS, getMetricDef, INDICATORS, isComparable } from '$lib/indicators';
	import type { ChartSeries, Point } from '$lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const MAX = 5;
	const COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];
	const sortedCountries = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, 'es'));
	const indicatorBySlug = new Map(INDICATORS.map((i) => [i.slug, i]));

	const selected = $derived(data.selected);
	const colorOf = (iso3: string) => COLORS[selected.indexOf(iso3)] ?? 'var(--muted)';

	function toggle(iso3: string) {
		const next = selected.includes(iso3)
			? selected.filter((c) => c !== iso3)
			: selected.length < MAX
				? [...selected, iso3]
				: selected;
		if (!next.length || next === selected) return;
		goto(`?p=${next.map((c) => c.toLowerCase()).join(',')}`, {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
	}

	// Gráfica: una métrica, los países elegidos y la mediana regional.
	let chartMetric = $state('gdppc_ppp');
	let regional = $state<{ byCountry: Record<string, Point[]>; medianSeries: Point[] } | null>(null);
	const chartDef = $derived(getMetricDef(chartMetric));

	$effect(() => {
		const id = chartMetric;
		const controller = new AbortController();
		fetch(`/api/metricas/${id}`, { signal: controller.signal })
			.then((r) => r.json())
			.then((json) => (regional = json))
			.catch(() => {});
		return () => controller.abort();
	});

	const series = $derived.by((): ChartSeries[] => {
		if (!regional) return [];
		const since = new Date().getFullYear() - 25;
		const cut = (pts: Point[]) => pts.filter((p) => p.t >= since);
		return [
			{
				key: 'median',
				label: 'Mediana regional',
				color: 'var(--muted)',
				points: cut(regional.medianSeries),
				dashed: true,
				width: 1.5
			},
			...selected
				.filter((iso3) => regional!.byCountry[iso3]?.length)
				.map((iso3) => ({
					key: iso3,
					label: getCountry(iso3)!.name,
					color: colorOf(iso3),
					points: cut(regional!.byCountry[iso3]),
					width: 2.5
				}))
		];
	});

	const comparable = (id: string) => isComparable(getMetricDef(id));

	/** El mejor valor de la fila (solo si la métrica tiene dirección). */
	function bestOf(id: string, cells: Record<string, { value: number } | null>): string | null {
		const def = getMetricDef(id);
		if (!def.better) return null;
		const entries = Object.entries(cells).filter(
			(e): e is [string, { value: number }] => e[1] != null
		);
		if (entries.length < 2) return null;
		entries.sort((a, b) =>
			def.better === 'up' ? b[1].value - a[1].value : a[1].value - b[1].value
		);
		return entries[0][0];
	}
</script>

<svelte:head>
	<title>Comparar países · Crixeconomics</title>
</svelte:head>

<div class="container page">
	<header class="head">
		<p class="kicker">Comparador</p>
		<h1>Frente a frente</h1>
		<p class="lede">
			Elige hasta {MAX} países. La tabla muestra el último dato de cada métrica, su año y la posición
			en la región.
		</p>
	</header>

	<div class="picker" role="group" aria-label="Países a comparar">
		{#each sortedCountries as c (c.iso3)}
			{@const on = selected.includes(c.iso3)}
			<button
				class:on
				aria-pressed={on}
				disabled={!on && selected.length >= MAX}
				onclick={() => toggle(c.iso3)}
				style:--chip={on ? colorOf(c.iso3) : undefined}
			>
				<Flag iso2={c.iso2} size={12} />
				{c.name}
			</button>
		{/each}
	</div>

	<section class="chart-card">
		<div class="chart-head">
			<label>
				<span class="kicker">Evolución de</span>
				<select class="select" bind:value={chartMetric}>
					{#each INDICATORS as ind (ind.slug)}
						<optgroup label="{ind.n}. {ind.title}">
							{#each ind.metrics.filter(comparable) as id (id)}
								<option value={id}>{getMetricDef(id).label}</option>
							{/each}
						</optgroup>
					{/each}
				</select>
			</label>
			<div class="legend">
				{#each selected as iso3 (iso3)}
					<span><i style:background={colorOf(iso3)}></i>{getCountry(iso3)?.name}</span>
				{/each}
				<span><i class="dash"></i>Mediana regional</span>
			</div>
		</div>
		{#if series.length}
			<LineChart {series} format={(v) => formatValue(v, chartDef, { short: true })} height={320} />
		{:else}
			<Skeleton height={320} />
		{/if}
	</section>

	{#await data.table}
		<Skeleton height={600} label="Armando la tabla comparativa…" />
	{:then rows}
		<div class="scroller">
			<table>
				<thead>
					<tr>
						<th class="metric-col">Métrica</th>
						{#each selected as iso3 (iso3)}
							{@const c = getCountry(iso3)!}
							<th class="country-col" style:--chip={colorOf(iso3)}>
								<a href="/pais/{iso3.toLowerCase()}"><Flag iso2={c.iso2} size={14} /> {c.name}</a>
							</th>
						{/each}
					</tr>
				</thead>
				{#each GROUPS as g (g.id)}
					<tbody>
						<tr class="group-row">
							<th colspan={selected.length + 1}>{g.title}</th>
						</tr>
						{#each rows.filter((r) => indicatorBySlug.get(r.slug)?.group === g.id) as row (row.slug)}
							{@const ind = indicatorBySlug.get(row.slug)!}
							<tr class="ind-row">
								<th colspan={selected.length + 1}
									><span class="num">{String(ind.n).padStart(2, '0')}</span> {ind.title}</th
								>
							</tr>
							{#each row.metrics as m (m.id)}
								{@const def = getMetricDef(m.id)}
								{@const best = bestOf(m.id, m.cells)}
								<tr>
									<th class="metric" scope="row">
										{def.label}
										{#if def.better}<span class="dir"
												>{def.better === 'up' ? '↑ mejor' : '↓ mejor'}</span
											>{/if}
									</th>
									{#each selected as iso3 (iso3)}
										{@const cell = m.cells[iso3]}
										<td class:best={best === iso3}>
											{#if cell}
												<span class="v num"
													>{formatValue(cell.value, def, {
														currency: getCountry(iso3)?.currency
													})}</span
												>
												<span class="y num"
													>{cell.label}{cell.rank
														? ` · ${ordinal(cell.rank)}/${cell.ranked}`
														: ''}</span
												>
											{:else}
												<span class="na">—</span>
											{/if}
										</td>
									{/each}
								</tr>
							{/each}
						{/each}
					</tbody>
				{/each}
			</table>
		</div>
	{/await}
</div>

<style>
	.page {
		padding-top: 36px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}
	h1 {
		font-size: clamp(36px, 5vw, 56px);
		margin: 8px 0 10px;
	}
	.lede {
		color: var(--ink-2);
		max-width: 60ch;
	}
	.picker {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.picker button {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 5px 11px 5px 7px;
		border-radius: 99px;
		border: 1px solid var(--rule);
		background: var(--surface);
		font-size: 13px;
		cursor: pointer;
	}
	.picker button:hover:not(:disabled) {
		border-color: var(--ink-2);
	}
	.picker button.on {
		border-color: var(--chip);
		box-shadow: inset 0 0 0 1px var(--chip);
		background: color-mix(in srgb, var(--chip) 10%, var(--surface));
		font-weight: 500;
	}
	.picker button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.chart-card {
		background: var(--surface);
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		padding: 16px 18px 10px;
	}
	.chart-head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: end;
		gap: 12px 24px;
		margin-bottom: 10px;
	}
	.chart-head label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: min(100%, 320px);
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 14px;
		font-size: 12px;
		color: var(--ink-2);
	}
	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.legend i {
		display: inline-block;
		width: 14px;
		height: 3px;
		border-radius: 2px;
	}
	.legend i.dash {
		background: repeating-linear-gradient(90deg, var(--muted) 0 4px, transparent 4px 7px);
	}
	.scroller {
		overflow-x: auto;
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		background: var(--surface);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}
	th,
	td {
		padding: 8px 12px;
		border-bottom: 1px solid var(--rule);
		text-align: left;
		vertical-align: top;
	}
	thead th {
		position: sticky;
		top: 0;
		background: var(--surface);
		z-index: 1;
		font-weight: 500;
	}
	.metric-col {
		min-width: 230px;
	}
	.country-col {
		min-width: 140px;
		border-bottom: 2px solid var(--chip);
	}
	.country-col a {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		text-decoration: none;
	}
	.group-row th {
		font-family: var(--font-display);
		font-size: 19px;
		font-weight: 500;
		padding-top: 22px;
		background: var(--paper);
	}
	.ind-row th {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--ink);
		background: var(--surface-2);
		padding: 6px 12px;
	}
	.ind-row .num {
		color: var(--accent);
		margin-right: 4px;
	}
	.metric {
		font-weight: 400;
		color: var(--ink-2);
	}
	.dir {
		display: block;
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--muted);
	}
	td .v {
		display: block;
		white-space: nowrap;
	}
	td .y {
		display: block;
		font-size: 10.5px;
		color: var(--muted);
	}
	td.best .v {
		font-weight: 600;
		color: var(--good);
	}
	td.best .v::after {
		content: ' ●';
		font-size: 9px;
		vertical-align: middle;
	}
	.na {
		color: var(--muted);
	}
</style>
