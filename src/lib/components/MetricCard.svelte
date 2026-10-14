<script lang="ts">
	import { yearOverYear } from '$lib/delta';
	import { formatValue, ordinal } from '$lib/format';
	import { getMetricDef, sourceLabel } from '$lib/indicators';
	import type { MetricSnapshot } from '$lib/types';
	import Sparkline from './Sparkline.svelte';
	import StripPlot from './StripPlot.svelte';

	let {
		snap,
		iso3,
		currency,
		featured = false
	}: { snap: MetricSnapshot; iso3: string; currency: string; featured?: boolean } = $props();

	const def = $derived(getMetricDef(snap.id));
	const fmt = (v: number | null | undefined) => formatValue(v, def, { currency });
	const fmtShort = (v: number) => formatValue(v, def, { currency, short: true });
	const delta = $derived(yearOverYear(snap.series, snap.latest, def));
	const valueText = $derived(fmt(snap.latest?.value));
	const rankLabel = $derived(
		snap.rank == null
			? null
			: def.better
				? `${ordinal(snap.rank)} de ${snap.ranked}`
				: `${ordinal(snap.rank)} mayor de ${snap.ranked}`
	);
	const tone = $derived(
		snap.score == null || !def.better
			? 'neutral'
			: snap.score >= 0.66
				? 'good'
				: snap.score <= 0.33
					? 'bad'
					: 'mid'
	);
	const signTone = $derived(
		def.signed && !def.better && snap.latest ? (snap.latest.value < 0 ? 'neg' : 'pos') : ''
	);
</script>

<article class="card" class:featured>
	<header>
		<h4>{def.label}</h4>
		{#if rankLabel}
			<span class="rank {tone}" title="Posición entre los países de la región con dato reciente"
				>{rankLabel}</span
			>
		{/if}
	</header>

	{#if snap.error && !snap.latest}
		<p class="state">Fuente no disponible en este momento.</p>
		<p class="state small" title={snap.error}>Se reintentará automáticamente.</p>
	{:else if !snap.latest}
		<p class="state">Sin datos para este país.</p>
		{#if snap.ranked}
			<p class="state small">{snap.ranked} países de la región sí reportan.</p>
		{/if}
	{:else}
		<div class="value-row">
			<span class="value num {signTone}" class:long={valueText.length > 15}>{valueText}</span>
			<span
				class="year num"
				class:stale={snap.stale}
				title={snap.stale ? 'Dato con más de 5 años de antigüedad' : undefined}
			>
				{snap.latest.label}{snap.stale ? ' · antiguo' : ''}
			</span>
		</div>

		<div class="meta">
			{#if delta}
				<span class="delta {delta.tone}"
					>{delta.text} <span class="vs">vs. {delta.versus}</span></span
				>
			{/if}
			{#if snap.projection}
				<span class="proj"
					>FMI {snap.projection.label}: <b class="num">{fmt(snap.projection.value)}</b></span
				>
			{/if}
			{#if snap.median != null && snap.ranked > 2}
				<span class="median">Mediana regional <b class="num">{fmt(snap.median)}</b></span>
			{/if}
		</div>

		{#if snap.series.length > 2}
			<div class="spark">
				<Sparkline
					points={snap.series}
					reference={snap.medianSeries}
					height={featured ? 56 : 40}
					label="Evolución de {def.label}"
				/>
			</div>
		{/if}

		{#if snap.peers.length > 2}
			<StripPlot peers={snap.peers} highlight={iso3} median={snap.median} format={fmtShort} />
		{/if}
	{/if}

	<footer>
		{#if def.hint}<span class="hint">{def.hint}</span>{/if}
		<span class="source">{sourceLabel(def)}</span>
	</footer>
</article>

<style>
	.card {
		background: var(--surface);
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		padding: 14px 16px 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 10px;
	}
	h4 {
		font-family: var(--font-ui);
		font-size: 13px;
		font-weight: 500;
		color: var(--ink-2);
		line-height: 1.35;
		letter-spacing: 0;
	}
	.rank {
		flex: none;
		font-family: var(--font-mono);
		font-size: 10.5px;
		padding: 2px 7px;
		border-radius: 99px;
		background: var(--surface-2);
		color: var(--ink-2);
		white-space: nowrap;
	}
	.rank.good {
		background: color-mix(in srgb, var(--good) 16%, transparent);
		color: var(--good);
	}
	.rank.bad {
		background: color-mix(in srgb, var(--bad) 14%, transparent);
		color: var(--bad);
	}
	.value-row {
		display: flex;
		align-items: baseline;
		gap: 10px;
		flex-wrap: wrap;
	}
	.value {
		font-size: 22px;
		font-weight: 500;
		line-height: 1.15;
	}
	.featured .value {
		font-size: 28px;
	}
	.value.long {
		font-size: 18px;
	}
	.value.neg {
		color: var(--bad);
	}
	.year {
		font-size: 11.5px;
		color: var(--muted);
	}
	.year.stale {
		color: var(--gold);
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 12px;
		font-size: 12px;
		color: var(--muted);
	}
	.meta b {
		font-weight: 500;
		color: var(--ink-2);
	}
	.delta {
		font-family: var(--font-mono);
		font-size: 11.5px;
	}
	.delta.good {
		color: var(--good);
	}
	.delta.bad {
		color: var(--bad);
	}
	.vs {
		font-family: var(--font-ui);
		color: var(--muted);
	}
	.spark {
		margin-top: 2px;
	}
	.state {
		font-size: 13px;
		color: var(--muted);
	}
	.state.small {
		font-size: 12px;
	}
	footer {
		margin-top: auto;
		padding-top: 6px;
		border-top: 1px dashed var(--rule);
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 11.5px;
		color: var(--muted);
		line-height: 1.4;
	}
	.source {
		font-family: var(--font-mono);
		font-size: 10.5px;
		letter-spacing: 0.02em;
	}
</style>
