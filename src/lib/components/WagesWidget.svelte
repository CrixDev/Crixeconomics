<script lang="ts">
	import { num } from '$lib/format';
	import type { MetricSnapshot } from '$lib/types';

	let { metrics }: { metrics: MetricSnapshot[] } = $props();

	const get = (id: string) => metrics.find((m) => m.id === id)?.latest ?? null;

	const rows = $derived(
		[
			{ key: 'min', label: 'Salario mínimo', ppp: get('minwage_ppp'), usd: get('minwage_usd') },
			{ key: 'med', label: 'Salario mediano', ppp: get('medwage_ppp'), usd: get('medwage_usd') }
		].filter((r) => r.ppp || r.usd)
	);
	const max = $derived(Math.max(...rows.map((r) => r.ppp?.value ?? r.usd?.value ?? 0), 1));
	const kaitz = $derived(get('kaitz'));
</script>

<div class="wages">
	<div class="head">
		<h4>Mínimo frente a mediano</h4>
		<span class="kicker">Mensual · US$ PPA</span>
	</div>
	{#if rows.length}
		<div class="rows">
			{#each rows as r (r.key)}
				<div class="row">
					<span class="label">{r.label}</span>
					<span class="bar">
						<span class="fill {r.key}" style:width="{((r.ppp?.value ?? 0) / max) * 100}%"></span>
					</span>
					<span class="val num">
						{r.ppp ? num(r.ppp.value, 0) : '—'}
						<small>{r.ppp?.label ?? ''}</small>
					</span>
				</div>
				{#if r.usd}
					<p class="usd">
						Equivale a <b class="num">US$ {num(r.usd.value, 0)}</b> a tipo de cambio de mercado ({r
							.usd.label}).
					</p>
				{/if}
			{/each}
		</div>
		{#if kaitz}
			<p class="kaitz">
				El mínimo equivale al <b class="num">{num(kaitz.value * 100, 0)} %</b> del salario mediano ({kaitz.label}).
				{#if kaitz.value > 0.8}Muy cerca del trabajador típico: el mínimo "muerde" fuerte.{:else if kaitz.value < 0.4}Bastante
					por debajo del trabajador típico.{/if}
			</p>
		{/if}
	{:else}
		<p class="kaitz">La OIT no tiene estimaciones salariales recientes para este país.</p>
	{/if}
</div>

<style>
	.wages {
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
	.rows {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.row {
		display: grid;
		grid-template-columns: 110px minmax(0, 1fr) auto;
		gap: 10px;
		align-items: center;
		font-size: 13px;
	}
	.bar {
		height: 14px;
		background: var(--surface-2);
		border-radius: 4px;
		overflow: hidden;
	}
	.fill {
		display: block;
		height: 100%;
		border-radius: 4px;
	}
	.fill.min {
		background: var(--gold);
	}
	.fill.med {
		background: var(--accent);
	}
	.val {
		text-align: right;
		font-weight: 500;
	}
	.val small {
		font-weight: 400;
		color: var(--muted);
		font-size: 10.5px;
		margin-left: 4px;
	}
	.usd {
		font-size: 11.5px;
		color: var(--muted);
		padding-left: 120px;
		margin-bottom: 4px;
	}
	.usd b {
		font-weight: 500;
		color: var(--ink-2);
	}
	.kaitz {
		font-size: 12.5px;
		color: var(--ink-2);
		border-top: 1px dashed var(--rule);
		padding-top: 10px;
	}
	@media (max-width: 520px) {
		.row {
			grid-template-columns: 90px minmax(0, 1fr) auto;
		}
		.usd {
			padding-left: 0;
		}
	}
</style>
