<script lang="ts">
	import Flag from '$lib/components/Flag.svelte';
	import IndicatorSection from '$lib/components/IndicatorSection.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import { formatValue, ordinal } from '$lib/format';
	import { GROUPS, getMetricDef, INDICATORS, type GroupId } from '$lib/indicators';
	import type { IndicatorView } from '$lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const c = $derived(data.country);
	const groupData = $derived<Record<GroupId, Promise<IndicatorView[]>>>({
		economia: data.economia,
		bienestar: data.bienestar,
		poder: data.poder
	});
	const indicatorBySlug = new Map(INDICATORS.map((i) => [i.slug, i]));
</script>

<svelte:head>
	<title>{c.name} en 20 indicadores · Crixeconomics</title>
	<meta
		name="description"
		content="Economía, bienestar e instituciones de {c.name}: población, PIB, inflación, tipo de cambio, salarios, pobreza, desigualdad, deuda y más, comparados con América Latina."
	/>
</svelte:head>

<div class="hero">
	<div class="container">
		<a class="back" href="/">← Panorama regional</a>
		<div class="title-row">
			<Flag iso2={c.iso2} size={34} alt="Bandera de {c.name}" />
			<h1>{c.name}</h1>
		</div>
		<p class="facts">
			<span>{c.subregion}</span>
			<span>Capital: {c.capital}</span>
			<span>Moneda: {c.currencyName} <span class="num">({c.currency})</span></span>
			<a href="/comparar?p={c.iso3.toLowerCase()},mex,bra,arg">Comparar →</a>
		</p>
		{#if c.note}
			<p class="country-note">{c.note}</p>
		{/if}

		{#await data.kpis}
			<div class="kpis">
				<Skeleton height={86} label="Consultando Banco Mundial, FMI y PNUD…" />
			</div>
		{:then kpis}
			<dl class="kpis">
				{#each kpis as k (k.id)}
					{@const def = getMetricDef(k.id)}
					<div class="kpi">
						<dt>{def.label}</dt>
						<dd class="num">{formatValue(k.latest?.value, def, { currency: c.currency })}</dd>
						<dd class="sub">
							{#if k.latest}<span class="num" class:stale={k.stale}>{k.latest.label}</span>{/if}
							{#if k.rank}<span>· {ordinal(k.rank)} de {k.ranked}</span>{/if}
						</dd>
					</div>
				{/each}
			</dl>
		{/await}
	</div>
</div>

<div class="container layout">
	<aside class="toc" aria-label="Índice de indicadores">
		{#each GROUPS as g (g.id)}
			<p class="toc-group">{g.title}</p>
			<ol>
				{#each INDICATORS.filter((i) => i.group === g.id) as ind (ind.slug)}
					<li>
						<a href="#{ind.slug}"
							><span class="num">{String(ind.n).padStart(2, '0')}</span>{ind.title}</a
						>
					</li>
				{/each}
			</ol>
		{/each}
	</aside>

	<div class="content">
		<nav class="chips" aria-label="Saltar a indicador">
			{#each INDICATORS as ind (ind.slug)}
				<a href="#{ind.slug}" title={ind.title}>{ind.n}</a>
			{/each}
		</nav>

		{#each GROUPS as g (g.id)}
			<div class="group" id="grupo-{g.id}">
				<div class="group-head">
					<span class="kicker">{g.kicker}</span>
					<h2>{g.title}</h2>
				</div>
				{#await groupData[g.id]}
					{#each INDICATORS.filter((i) => i.group === g.id) as ind (ind.slug)}
						<section id={ind.slug} class="placeholder">
							<h3><span class="num">{String(ind.n).padStart(2, '0')}</span> {ind.title}</h3>
							<Skeleton height={180} />
						</section>
					{/each}
				{:then views}
					{#each views as view (view.slug)}
						{@const def = indicatorBySlug.get(view.slug)!}
						<IndicatorSection
							{def}
							{view}
							iso3={c.iso3}
							countryName={c.name}
							currency={c.currency}
							currencyName={c.currencyName}
							fx={data.fx}
							trade={data.trade}
						/>
					{/each}
				{:catch err}
					<p class="error">No se pudieron cargar estos indicadores: {err?.message ?? err}</p>
				{/await}
			</div>
		{/each}
	</div>
</div>

<style>
	.hero {
		padding: 28px 0 30px;
		border-bottom: 1px solid var(--rule);
		background:
			radial-gradient(
				1200px 300px at 10% -40%,
				color-mix(in srgb, var(--accent) 10%, transparent),
				transparent
			),
			var(--paper);
	}
	.back {
		font-size: 13px;
		color: var(--muted);
		text-decoration: none;
	}
	.back:hover {
		color: var(--ink);
	}
	.title-row {
		display: flex;
		align-items: center;
		gap: 16px;
		margin: 14px 0 8px;
	}
	h1 {
		font-size: clamp(38px, 6vw, 64px);
		font-weight: 500;
		letter-spacing: -0.025em;
	}
	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 18px;
		color: var(--ink-2);
		font-size: 14px;
	}
	.facts a {
		color: var(--accent);
		font-weight: 500;
	}
	.country-note {
		margin-top: 12px;
		max-width: 70ch;
		font-size: 13.5px;
		color: var(--ink-2);
		border-left: 3px solid var(--gold);
		padding: 2px 0 2px 12px;
	}
	.kpis {
		margin: 24px 0 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
		gap: 1px;
		background: var(--rule);
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		overflow: hidden;
	}
	div.kpis {
		display: block;
		background: none;
		border: 0;
	}
	.kpi {
		background: var(--surface);
		padding: 14px 16px;
		min-width: 0;
	}
	.kpi dt {
		font-size: 12px;
		color: var(--muted);
	}
	.kpi dd {
		margin: 0;
	}
	.kpi dd.num {
		font-size: 19px;
		font-weight: 500;
		margin-top: 4px;
		line-height: 1.25;
	}
	.kpi .sub {
		font-size: 11.5px;
		color: var(--muted);
		display: flex;
		gap: 4px;
	}
	.kpi .stale {
		color: var(--gold);
	}
	.layout {
		display: grid;
		grid-template-columns: 230px minmax(0, 1fr);
		gap: 40px;
		align-items: start;
	}
	.toc {
		position: sticky;
		top: 80px;
		max-height: calc(100vh - 96px);
		overflow-y: auto;
		padding: 28px 4px 24px 0;
		font-size: 13px;
		scrollbar-width: thin;
	}
	.toc-group {
		font-family: var(--font-mono);
		font-size: 10.5px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		margin: 14px 0 6px;
		line-height: 1.35;
	}
	.toc-group:first-child {
		margin-top: 0;
	}
	.toc ol {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.toc a {
		display: grid;
		grid-template-columns: 24px 1fr;
		gap: 6px;
		padding: 4px 6px;
		border-radius: 6px;
		text-decoration: none;
		color: var(--ink-2);
		line-height: 1.3;
	}
	.toc a:hover {
		background: var(--surface-2);
		color: var(--ink);
	}
	.toc .num {
		color: var(--muted);
		font-size: 11px;
		padding-top: 1px;
	}
	.chips {
		display: none;
	}
	.group-head {
		padding: 40px 0 6px;
	}
	.group-head h2 {
		font-size: clamp(28px, 4vw, 40px);
		margin-top: 6px;
	}
	.placeholder {
		padding: 34px 0;
		border-top: 1px solid var(--rule);
	}
	.placeholder h3 {
		font-size: 24px;
		margin-bottom: 14px;
		color: var(--muted);
	}
	.error {
		color: var(--bad);
		padding: 20px 0;
	}
	@media (max-width: 1024px) {
		.layout {
			grid-template-columns: minmax(0, 1fr);
		}
		.toc {
			display: none;
		}
		.chips {
			display: flex;
			gap: 6px;
			overflow-x: auto;
			padding: 16px 0 4px;
			scrollbar-width: none;
		}
		.chips a {
			flex: none;
			font-family: var(--font-mono);
			font-size: 12px;
			width: 32px;
			height: 32px;
			display: grid;
			place-items: center;
			border: 1px solid var(--rule-strong);
			border-radius: 99px;
			text-decoration: none;
		}
	}
</style>
