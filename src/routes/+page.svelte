<script lang="ts">
	import Flag from '$lib/components/Flag.svelte';
	import Matrix from '$lib/components/Matrix.svelte';
	import RankingExplorer from '$lib/components/RankingExplorer.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import { COUNTRIES } from '$lib/countries';
	import { compact, num } from '$lib/format';
	import { GROUPS, INDICATORS } from '$lib/indicators';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const sorted = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, 'es'));
</script>

<svelte:head>
	<title>Crixeconomics · América Latina en 20 indicadores</title>
	<meta
		name="description"
		content="Compara a los 20 países de América Latina en 20 indicadores económicos, sociales e institucionales con datos en vivo del Banco Mundial, FMI, OIT, PNUD y más."
	/>
</svelte:head>

<section class="hero">
	<div class="container hero-grid">
		<div>
			<p class="kicker">20 países · 20 indicadores · 9 fuentes públicas</p>
			<h1>América Latina,<br /><em>medida con lo que importa.</em></h1>
			<p class="lede">
				Producción, precios, salarios, pobreza, desigualdad, salud, instituciones y poder
				estratégico, consultados en vivo a las APIs del Banco Mundial, el FMI, la OIT, el PNUD y
				otras fuentes abiertas. Cada cifra trae su año y su fuente.
			</p>
		</div>
		{#await data.summary}
			<Skeleton height={190} label="Sumando la región…" />
		{:then s}
			<dl class="summary">
				<div>
					<dt>Población</dt>
					<dd class="num">{compact(s.pop)}</dd>
				</div>
				<div>
					<dt>PIB conjunto</dt>
					<dd class="num">US$ {compact(s.gdp, true)}</dd>
				</div>
				<div>
					<dt>Crecimiento mediano</dt>
					<dd class="num">{s.growth != null ? `${num(s.growth, 1, true)} %` : '—'}</dd>
				</div>
				<div>
					<dt>Inflación mediana</dt>
					<dd class="num">{s.inflation != null ? `${num(s.inflation, 1)} %` : '—'}</dd>
				</div>
				<p class="summary-note">Último dato disponible de cada país (≈ {s.year}). Banco Mundial.</p>
			</dl>
		{/await}
	</div>
</section>

<section class="container countries" aria-label="Países">
	<ul>
		{#each sorted as c (c.iso3)}
			<li>
				<a href="/pais/{c.iso3.toLowerCase()}">
					<Flag iso2={c.iso2} size={16} />
					<span>{c.name}</span>
				</a>
			</li>
		{/each}
	</ul>
</section>

<section class="container block">
	<div class="block-head">
		<div>
			<p class="kicker">Matriz regional</p>
			<h2>La región de un vistazo</h2>
		</div>
		<p>
			Cada columna es la métrica principal de un indicador. El color indica la posición del país
			frente a sus vecinos, no un juicio absoluto. Haz clic en un país para ver su ficha completa.
		</p>
	</div>
	{#await data.matrix}
		<Skeleton height={620} label="Consultando 20 indicadores para 20 países…" />
	{:then rows}
		<Matrix {rows} />
	{:catch err}
		<p class="error">No se pudo armar la matriz: {err?.message ?? err}</p>
	{/await}
</section>

<section class="container block">
	<div class="block-head">
		<div>
			<p class="kicker">Explorador</p>
			<h2>Rankings y trayectorias</h2>
		</div>
		<p>
			Elige cualquiera de las métricas y compara a los 20 países, con su evolución desde hace 25
			años frente a la mediana regional.
		</p>
	</div>
	<RankingExplorer />
</section>

<section class="container block">
	<div class="block-head">
		<div>
			<p class="kicker">Marco</p>
			<h2>Los 20 indicadores</h2>
		</div>
	</div>
	<div class="framework">
		{#each GROUPS as g (g.id)}
			<div class="fw-group">
				<h3>{g.title}</h3>
				<ol>
					{#each INDICATORS.filter((i) => i.group === g.id) as ind (ind.slug)}
						<li>
							<span class="num">{String(ind.n).padStart(2, '0')}</span>
							<div>
								<strong>{ind.title}</strong>
								<p>{ind.summary}</p>
							</div>
						</li>
					{/each}
				</ol>
			</div>
		{/each}
	</div>
</section>

<style>
	.hero {
		padding: clamp(36px, 7vw, 80px) 0 36px;
		background:
			radial-gradient(
				900px 380px at 85% 0%,
				color-mix(in srgb, var(--gold) 12%, transparent),
				transparent
			),
			radial-gradient(
				900px 380px at 0% 100%,
				color-mix(in srgb, var(--accent) 10%, transparent),
				transparent
			);
	}
	.hero-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
		gap: 48px;
		align-items: end;
	}
	h1 {
		font-size: clamp(40px, 6.4vw, 76px);
		font-weight: 500;
		letter-spacing: -0.03em;
		line-height: 1;
		margin: 14px 0 18px;
	}
	h1 em {
		font-style: italic;
		color: var(--accent);
	}
	.lede {
		font-size: 17px;
		color: var(--ink-2);
		max-width: 58ch;
	}
	.summary {
		margin: 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1px;
		background: var(--rule);
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		overflow: hidden;
	}
	.summary div {
		background: var(--surface);
		padding: 16px 18px;
	}
	.summary dt {
		font-size: 12px;
		color: var(--muted);
	}
	.summary dd {
		margin: 4px 0 0;
		font-size: 24px;
		font-weight: 500;
	}
	.summary-note {
		grid-column: 1 / -1;
		background: var(--surface);
		padding: 8px 18px;
		font-size: 11.5px;
		color: var(--muted);
	}
	.countries ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.countries a {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px 6px 8px;
		background: var(--surface);
		border: 1px solid var(--rule);
		border-radius: 99px;
		text-decoration: none;
		font-size: 13.5px;
	}
	.countries a:hover {
		border-color: var(--ink-2);
	}
	.block {
		margin-top: 64px;
	}
	.block-head {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
		gap: 12px 40px;
		align-items: end;
		margin-bottom: 20px;
	}
	.block-head h2 {
		font-size: clamp(28px, 4vw, 42px);
		margin-top: 6px;
	}
	.block-head > p {
		color: var(--ink-2);
		font-size: 14px;
		max-width: 62ch;
	}
	.framework {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 32px;
	}
	.fw-group h3 {
		font-size: 21px;
		padding-bottom: 10px;
		border-bottom: 2px solid var(--ink);
		margin-bottom: 8px;
	}
	.fw-group ol {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.fw-group li {
		display: grid;
		grid-template-columns: 28px 1fr;
		gap: 8px;
		padding: 10px 0;
		border-bottom: 1px solid var(--rule);
	}
	.fw-group .num {
		color: var(--accent);
		font-size: 12px;
		padding-top: 2px;
	}
	.fw-group strong {
		font-weight: 600;
		font-size: 14px;
	}
	.fw-group p {
		font-size: 13px;
		color: var(--muted);
		margin-top: 2px;
	}
	.error {
		color: var(--bad);
	}
	@media (max-width: 900px) {
		.hero-grid,
		.block-head,
		.framework {
			grid-template-columns: minmax(0, 1fr);
		}
		.hero-grid {
			gap: 28px;
		}
	}
</style>
