<script lang="ts">
	import { untrack } from 'svelte';
	import { COUNTRIES } from '$lib/countries';
	import { formatValue } from '$lib/format';
	import { getMetricDef, INDICATORS, isComparable } from '$lib/indicators';
	import type { ChartSeries, Peer, Point } from '$lib/types';
	import Flag from './Flag.svelte';
	import LineChart from './LineChart.svelte';

	type ApiMetric = {
		id: string;
		peers: Peer[];
		median: number | null;
		medianSeries: Point[];
		byCountry: Record<string, Point[]>;
		source: string;
		error: string | null;
	};

	let { initial = 'gdppc_ppp' }: { initial?: string } = $props();

	let metricId = $state(untrack(() => initial));
	let selected = $state('MEX');
	let result = $state<ApiMetric | null>(null);
	let loading = $state(true);
	let failed = $state<string | null>(null);

	const def = $derived(getMetricDef(metricId));
	const countries = new Map(COUNTRIES.map((c) => [c.iso3, c]));

	$effect(() => {
		const id = metricId;
		const controller = new AbortController();
		loading = true;
		failed = null;
		fetch(`/api/metricas/${id}`, { signal: controller.signal })
			.then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
			.then((json: ApiMetric) => {
				result = json;
				loading = false;
			})
			.catch((e: Error) => {
				if (e.name === 'AbortError') return;
				failed = e.message;
				loading = false;
			});
		return () => controller.abort();
	});

	const fmt = (v: number, iso3?: string) =>
		formatValue(v, def, {
			currency: iso3 ? countries.get(iso3)?.currency : undefined,
			short: true
		});

	const scale = $derived.by(() => {
		const vs = result?.peers.map((p) => p.value) ?? [];
		const min = Math.min(0, ...vs);
		const max = Math.max(0, ...vs);
		const span = max - min || 1;
		return { zero: (-min / span) * 100, span };
	});

	const chartSeries = $derived.by((): ChartSeries[] => {
		if (!result) return [];
		const since = new Date().getFullYear() - 25;
		const cut = (pts: Point[]) => pts.filter((p) => p.t >= since);
		const others = Object.entries(result.byCountry)
			.filter(([iso3]) => iso3 !== selected)
			.map(([iso3, points]) => ({
				key: iso3,
				label: countries.get(iso3)?.name ?? iso3,
				color: 'color-mix(in srgb, var(--ink) 13%, transparent)',
				points: cut(points),
				width: 1,
				quiet: true
			}));
		const mine = result.byCountry[selected];
		return [
			...others,
			{
				key: 'median',
				label: 'Mediana regional',
				color: 'var(--muted)',
				points: cut(result.medianSeries),
				dashed: true,
				width: 1.5
			},
			...(mine
				? [
						{
							key: selected,
							label: countries.get(selected)!.name,
							color: 'var(--accent)',
							points: cut(mine),
							width: 2.75
						}
					]
				: [])
		];
	});

	// Las métricas en moneda local no son comparables entre países.
	const comparable = (id: string) => isComparable(getMetricDef(id));
</script>

<div class="explorer">
	<div class="controls">
		<label>
			<span class="kicker">Métrica</span>
			<select class="select" bind:value={metricId}>
				{#each INDICATORS as ind (ind.slug)}
					<optgroup label="{ind.n}. {ind.title}">
						{#each ind.metrics.filter(comparable) as id (id)}
							<option value={id}>{getMetricDef(id).label}</option>
						{/each}
					</optgroup>
				{/each}
			</select>
		</label>
		<p class="desc">
			{#if def.hint}{def.hint} ·
			{/if}
			{#if def.better === 'up'}Más alto es mejor.{:else if def.better === 'down'}Más bajo es mejor.{:else}Sin
				dirección "mejor": se ordena de mayor a menor.{/if}
			{#if result}<span class="src">Fuente: {result.source}</span>{/if}
		</p>
	</div>

	{#if failed}
		<p class="state">No se pudo cargar la métrica ({failed}).</p>
	{:else if result && !loading && !result.peers.length}
		<p class="state">{result.error ?? 'Sin datos recientes para la región.'}</p>
	{:else if result}
		<div class="panes" class:dim={loading}>
			<ol class="bars" aria-label="Ranking regional">
				{#each result.peers as p, i (p.iso3)}
					{@const c = countries.get(p.iso3)!}
					{@const width = (Math.abs(p.value) / scale.span) * 100}
					<li>
						<button class:active={p.iso3 === selected} onclick={() => (selected = p.iso3)}>
							<span class="pos num">{i + 1}</span>
							<span class="who"><Flag iso2={c.iso2} size={12} />{c.name}</span>
							<span class="track">
								<span class="zero" style:left="{scale.zero}%"></span>
								<span
									class="fill"
									class:negative={p.value < 0}
									style:left="{p.value < 0 ? scale.zero - width : scale.zero}%"
									style:width="{Math.max(width, 0.6)}%"
								></span>
							</span>
							<span class="val num">{fmt(p.value, p.iso3)}</span>
							<span class="yr num">{p.label}</span>
						</button>
					</li>
				{/each}
			</ol>
			<div class="evo">
				<div class="evo-head">
					<span class="kicker">Evolución</span>
					<span class="legend">
						<span><i style:background="var(--accent)"></i>{countries.get(selected)?.name}</span>
						<span><i class="dash"></i>Mediana</span>
						<span
							><i style:background="color-mix(in srgb, var(--ink) 20%, transparent)"></i>Resto</span
						>
					</span>
				</div>
				<LineChart series={chartSeries} format={(v) => fmt(v)} height={320} />
				<p class="tip">Haz clic en un país del ranking para resaltarlo.</p>
			</div>
		</div>
	{:else}
		<p class="state">Cargando…</p>
	{/if}
</div>

<style>
	.explorer {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 10px 24px;
		align-items: end;
	}
	.controls label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: min(100%, 340px);
	}
	.desc {
		font-size: 13px;
		color: var(--ink-2);
		flex: 1;
		min-width: 240px;
	}
	.src {
		display: block;
		color: var(--muted);
		font-size: 12px;
	}
	.panes {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
		gap: 24px;
		transition: opacity 0.2s;
	}
	.panes.dim {
		opacity: 0.5;
	}
	.bars {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.bars button {
		display: grid;
		grid-template-columns: 22px minmax(110px, 1.1fr) minmax(60px, 1.4fr) 76px 52px;
		gap: 10px;
		align-items: center;
		width: 100%;
		background: none;
		border: 0;
		border-radius: 6px;
		padding: 4px 6px;
		cursor: pointer;
		text-align: left;
		font-size: 13px;
	}
	.bars button:hover {
		background: var(--surface-2);
	}
	.bars button.active {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}
	.pos {
		color: var(--muted);
		font-size: 11px;
		text-align: right;
	}
	.who {
		display: flex;
		align-items: center;
		gap: 7px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.track {
		position: relative;
		height: 10px;
	}
	.zero {
		position: absolute;
		top: -3px;
		bottom: -3px;
		width: 1px;
		background: var(--rule-strong);
	}
	.fill {
		position: absolute;
		top: 0;
		bottom: 0;
		border-radius: 3px;
		background: color-mix(in srgb, var(--accent) 55%, var(--surface));
	}
	.active .fill {
		background: var(--accent);
	}
	.fill.negative {
		background: color-mix(in srgb, var(--bad) 55%, var(--surface));
	}
	.val {
		text-align: right;
		font-size: 12px;
	}
	.yr {
		color: var(--muted);
		font-size: 10.5px;
	}
	.evo {
		background: var(--surface);
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		padding: 14px 16px 10px;
		align-self: start;
		position: sticky;
		top: 84px;
		min-width: 0;
	}
	.evo-head {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 8px;
	}
	.legend {
		display: flex;
		gap: 12px;
		font-size: 12px;
		color: var(--muted);
		flex-wrap: wrap;
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
	.tip {
		font-size: 11.5px;
		color: var(--muted);
		margin-top: 4px;
	}
	.state {
		color: var(--muted);
		font-size: 14px;
	}
	@media (max-width: 900px) {
		.panes {
			grid-template-columns: minmax(0, 1fr);
		}
		.evo {
			position: static;
		}
	}
	@media (max-width: 520px) {
		.bars button {
			grid-template-columns: 18px minmax(90px, 1fr) minmax(40px, 1fr) 64px;
			gap: 8px;
		}
		.yr {
			display: none;
		}
	}
</style>
