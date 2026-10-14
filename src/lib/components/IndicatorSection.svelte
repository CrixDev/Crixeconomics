<script lang="ts">
	import { formatValue } from '$lib/format';
	import { getMetricDef, type IndicatorDef } from '$lib/indicators';
	import type { FxView, IndicatorView, TradeView } from '$lib/types';
	import CompositionBar from './CompositionBar.svelte';
	import FxWidget from './FxWidget.svelte';
	import LineChart from './LineChart.svelte';
	import MetricCard from './MetricCard.svelte';
	import Skeleton from './Skeleton.svelte';
	import TradeWidget from './TradeWidget.svelte';
	import WagesWidget from './WagesWidget.svelte';

	let {
		def,
		view,
		iso3,
		countryName,
		currency,
		currencyName,
		fx,
		trade
	}: {
		def: IndicatorDef;
		view: IndicatorView;
		iso3: string;
		countryName: string;
		currency: string;
		currencyName: string;
		fx: Promise<FxView | null>;
		trade: Promise<TradeView | null>;
	} = $props();

	const headline = $derived(view.metrics.find((m) => m.id === def.headline));
	const headDef = $derived(getMetricDef(def.headline));
	const chartSeries = $derived(
		headline && headline.series.length > 2
			? [
					{
						key: 'median',
						label: 'Mediana de América Latina',
						color: 'var(--rule-strong)',
						points: headline.medianSeries.filter((p) => p.t >= headline.series[0].t),
						width: 1.75
					},
					{
						key: iso3,
						label: countryName,
						color: 'var(--accent)',
						points: headline.series,
						width: 2.5
					}
				]
			: []
	);
	const number = $derived(String(def.n).padStart(2, '0'));
</script>

<section id={def.slug} class="indicator">
	<header class="sec-head">
		<span class="n num">{number}</span>
		<div>
			<h3>{def.title}</h3>
			<p class="summary">{def.summary}</p>
		</div>
	</header>

	{#if chartSeries.length}
		<div class="feature">
			<div class="feature-head">
				<span class="feature-title">{headDef.label}</span>
				<span class="legend">
					<span><i style:background="var(--accent)"></i>{countryName}</span>
					<span><i style:background="var(--rule-strong)"></i>Mediana regional</span>
				</span>
			</div>
			<LineChart
				series={chartSeries}
				format={(v) => formatValue(v, headDef, { currency, short: true })}
				height={220}
			/>
		</div>
	{/if}

	{#if def.widget === 'fx'}
		{#await fx}
			<Skeleton height={190} />
		{:then fxView}
			<FxWidget fx={fxView} {currencyName} />
		{/await}
	{:else if def.widget === 'trade'}
		{#await trade}
			<Skeleton height={260} label="Consultando UN Comtrade…" />
		{:then tradeView}
			<TradeWidget trade={tradeView} />
		{/await}
	{:else if def.widget === 'composition'}
		<CompositionBar metrics={view.metrics} />
	{:else if def.widget === 'wages'}
		<WagesWidget metrics={view.metrics} />
	{/if}

	<div class="grid">
		{#each view.metrics as snap (snap.id)}
			<MetricCard {snap} {iso3} {currency} />
		{/each}
	</div>

	{#if def.note || def.gaps?.length}
		<div class="notes">
			{#if def.note}
				<p class="note"><span class="kicker">Cómo leerlo</span>{def.note}</p>
			{/if}
			{#if def.gaps?.length}
				<div class="gaps">
					<span class="kicker">Sin API pública abierta</span>
					{#each def.gaps as gap (gap)}<p>{gap}</p>{/each}
				</div>
			{/if}
		</div>
	{/if}
</section>

<style>
	.indicator {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 34px 0 40px;
		border-top: 1px solid var(--rule);
	}
	.sec-head {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 16px;
		align-items: start;
	}
	.n {
		font-size: 13px;
		color: var(--accent);
		border: 1px solid currentColor;
		border-radius: 99px;
		padding: 3px 9px;
		margin-top: 4px;
	}
	h3 {
		font-size: clamp(24px, 3vw, 30px);
	}
	.summary {
		color: var(--ink-2);
		margin-top: 6px;
		max-width: 68ch;
	}
	.feature {
		background: var(--surface);
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		padding: 14px 16px 8px;
		min-width: 0;
	}
	.feature-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 6px 16px;
		margin-bottom: 6px;
	}
	.feature-title {
		font-size: 13px;
		font-weight: 600;
	}
	.legend {
		display: flex;
		gap: 14px;
		font-size: 12px;
		color: var(--muted);
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
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr));
		gap: 12px;
	}
	.notes {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
		gap: 12px 28px;
		font-size: 13px;
		color: var(--ink-2);
	}
	.note,
	.gaps {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.gaps p {
		color: var(--muted);
	}
</style>
