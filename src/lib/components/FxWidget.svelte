<script lang="ts">
	import { formatDate, num } from '$lib/format';
	import type { FxView } from '$lib/types';
	import Sparkline from './Sparkline.svelte';

	let { fx, currencyName }: { fx: FxView | null; currencyName: string } = $props();

	const NAMES = { USD: 'Dólar', EUR: 'Euro', CNY: 'Yuan' } as const;
	const decimals = (rate: number) => (rate >= 100 ? 1 : rate >= 1 ? 2 : 4);
	const dollarized = $derived(fx?.currency === 'USD');
</script>

<div class="fx">
	<div class="head">
		<h4>Mercado hoy</h4>
		{#if fx}
			<span class="kicker">Al {formatDate(fx.date)} · 12 meses</span>
		{/if}
	</div>

	{#if !fx || !fx.quotes.length}
		<p class="empty">No se pudo consultar el tipo de cambio de mercado en este momento.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th scope="col">Divisa</th>
					<th scope="col" class="r">{fx.currency} por unidad</th>
					<th scope="col" class="r">Variación 12 m</th>
					<th scope="col" class="trend">Tendencia</th>
				</tr>
			</thead>
			<tbody>
				{#each fx.quotes as q (q.code)}
					{@const fixed = dollarized && q.code === 'USD'}
					<tr>
						<th scope="row">
							<span class="code num">{q.code}</span>
							<span class="name">{NAMES[q.code]}</span>
						</th>
						<td class="r num">{num(q.rate, decimals(q.rate))}</td>
						<td class="r">
							{#if fixed}
								<span class="muted">fijo</span>
							{:else if q.change != null}
								<span class="chg num" class:pos={q.change > 0} class:neg={q.change < 0}>
									{num(q.change, 1, true)} %
								</span>
							{:else}
								<span class="muted">—</span>
							{/if}
						</td>
						<td class="trend">
							{#if !fixed && q.history.length > 2}
								<Sparkline
									points={q.history.map((h, i) => ({ t: i, label: h.date, value: h.rate }))}
									height={26}
									label="Tipo de cambio {fx.currency}/{q.code}, últimos 12 meses"
								/>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<p class="legend">
			Variación positiva: el {currencyName} se apreció (se necesitan menos unidades por divisa). En la
			tendencia, una línea que sube significa depreciación.
		</p>
	{/if}
</div>

<style>
	.fx {
		background: var(--surface);
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 10px;
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
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}
	th,
	td {
		padding: 7px 4px;
		border-bottom: 1px solid var(--rule);
		text-align: left;
		font-weight: 400;
	}
	thead th {
		font-size: 11px;
		color: var(--muted);
		padding-top: 0;
	}
	tbody tr:last-child > * {
		border-bottom: 0;
	}
	.r {
		text-align: right;
	}
	.code {
		font-weight: 500;
		margin-right: 6px;
	}
	.name {
		color: var(--muted);
	}
	.trend {
		width: 30%;
		min-width: 70px;
		padding-left: 14px;
	}
	.chg {
		font-size: 12px;
	}
	.muted,
	.empty,
	.legend {
		color: var(--muted);
	}
	.legend {
		font-size: 11.5px;
		line-height: 1.45;
	}
	@media (max-width: 520px) {
		.name {
			display: none;
		}
	}
</style>
