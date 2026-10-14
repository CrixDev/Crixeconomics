<script lang="ts">
	import { num } from '$lib/format';
	import type { MetricSnapshot } from '$lib/types';

	let { metrics }: { metrics: MetricSnapshot[] } = $props();

	const get = (id: string) => metrics.find((m) => m.id === id);

	/** Todos los componentes del mismo año (el último con dato de servicios). */
	const parts = $derived.by(() => {
		const services = get('services');
		const year = services?.latest?.t;
		if (year == null) return null;
		const at = (id: string) => get(id)?.series.find((p) => p.t === year)?.value ?? null;
		const agri = at('agri');
		const industry = at('industry');
		const manuf = at('manuf');
		const serv = at('services');
		if (agri == null || industry == null || serv == null) return null;
		const rest = Math.max(0, 100 - agri - industry - serv);
		return {
			year: services!.latest!.label,
			segments: [
				{ key: 'agri', label: 'Agricultura', value: agri, color: 'var(--seg-agri)' },
				{
					key: 'ind',
					label: manuf != null ? 'Industria (sin manufactura)' : 'Industria',
					value: manuf != null ? Math.max(0, industry - manuf) : industry,
					color: 'var(--seg-ind)'
				},
				...(manuf != null
					? [{ key: 'manuf', label: 'Manufactura', value: manuf, color: 'var(--seg-manuf)' }]
					: []),
				{ key: 'serv', label: 'Servicios', value: serv, color: 'var(--seg-serv)' },
				...(rest > 0.5
					? [
							{
								key: 'rest',
								label: 'Impuestos netos y ajustes',
								value: rest,
								color: 'var(--seg-rest)'
							}
						]
					: [])
			]
		};
	});

	const rents = $derived(
		[
			{ id: 'rents_oil', label: 'Petróleo' },
			{ id: 'rents_gas', label: 'Gas' },
			{ id: 'rents_min', label: 'Minerales' }
		].map((r) => ({ ...r, snap: get(r.id) }))
	);
</script>

<div class="comp">
	<div class="head">
		<h4>Estructura del valor agregado</h4>
		{#if parts}<span class="kicker">{parts.year} · % del PIB</span>{/if}
	</div>

	{#if parts}
		<div class="bar" role="img" aria-label="Composición del PIB por sector">
			{#each parts.segments as s (s.key)}
				<div
					class="seg"
					style:flex-grow={s.value}
					style:background={s.color}
					title="{s.label}: {num(s.value, 1)} %"
				>
					{#if s.value >= 9}<span class="num">{num(s.value, 0)}</span>{/if}
				</div>
			{/each}
		</div>
		<ul class="legend">
			{#each parts.segments as s (s.key)}
				<li>
					<span class="sw" style:background={s.color}></span>
					{s.label}
					<b class="num">{num(s.value, 1)} %</b>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">Sin desglose sectorial reciente.</p>
	{/if}

	<div class="rents">
		<span class="kicker">Rentas de recursos naturales (% del PIB)</span>
		<div class="rent-row">
			{#each rents as r (r.id)}
				<div>
					<span class="rent-label">{r.label}</span>
					<b class="num">{r.snap?.latest ? `${num(r.snap.latest.value, 1)} %` : '—'}</b>
					{#if r.snap?.latest}<span class="yr num">{r.snap.latest.label}</span>{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.comp {
		--seg-agri: #8aa35a;
		--seg-ind: #b07a4a;
		--seg-manuf: #c99a5b;
		--seg-serv: var(--accent);
		--seg-rest: var(--rule-strong);
		background: var(--surface);
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 0;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 8px;
		flex-wrap: wrap;
	}
	h4 {
		font-family: var(--font-ui);
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0;
	}
	.bar {
		display: flex;
		height: 34px;
		border-radius: 6px;
		overflow: hidden;
		gap: 2px;
	}
	.seg {
		flex-basis: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-size: 12px;
		min-width: 3px;
	}
	.legend {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr));
		gap: 4px 16px;
		font-size: 12.5px;
		color: var(--ink-2);
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.legend b {
		margin-left: auto;
		font-weight: 500;
		white-space: nowrap;
	}
	.sw {
		width: 10px;
		height: 10px;
		border-radius: 2px;
		flex: none;
	}
	.rents {
		border-top: 1px dashed var(--rule);
		padding-top: 10px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.rent-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		font-size: 12.5px;
	}
	.rent-row > div {
		display: flex;
		flex-direction: column;
	}
	.rent-label {
		color: var(--muted);
	}
	.rent-row b {
		font-weight: 500;
		font-size: 15px;
	}
	.yr {
		font-size: 10.5px;
		color: var(--muted);
	}
	.empty {
		color: var(--muted);
		font-size: 13px;
	}
</style>
