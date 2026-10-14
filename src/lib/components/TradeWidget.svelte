<script lang="ts">
	import { compact, num } from '$lib/format';
	import type { TradePartner, TradeView } from '$lib/types';
	import Flag from './Flag.svelte';

	let { trade }: { trade: TradeView | null } = $props();
</script>

{#snippet list(title: string, total: number, partners: TradePartner[], tone: string)}
	<div class="col">
		<div class="col-head">
			<h5>{title}</h5>
			<span class="num total">US$ {compact(total, true)}</span>
		</div>
		<ol>
			{#each partners as p (p.name)}
				<li>
					<span class="who">
						{#if p.iso2}<Flag iso2={p.iso2} size={12} />{/if}
						<span class="name">{p.name}</span>
					</span>
					<span class="bar"
						><span class="fill {tone}" style:width="{Math.max(1.5, p.share * 100)}%"></span></span
					>
					<span class="num share">{num(p.share * 100, 1)} %</span>
				</li>
			{/each}
		</ol>
	</div>
{/snippet}

<div class="trade">
	<div class="head">
		<h4>Principales socios comerciales</h4>
		{#if trade}<span class="kicker">Bienes · {trade.year} · UN Comtrade</span>{/if}
	</div>
	{#if trade}
		<div class="cols">
			{@render list('Destino de las exportaciones', trade.exportsTotal, trade.exports, 'x')}
			{@render list('Origen de las importaciones', trade.importsTotal, trade.imports, 'm')}
		</div>
		<p class="note">
			Solo comercio de mercancías reportado por el propio país; los servicios no se desglosan por
			socio.
		</p>
	{:else}
		<p class="note">
			El país no ha reportado su comercio por socio a UN Comtrade en los últimos años (o la API no
			respondió).
		</p>
	{/if}
</div>

<style>
	.trade {
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
	.cols {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 18px 28px;
	}
	.col-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 6px;
	}
	h5 {
		margin: 0;
		font-family: var(--font-ui);
		font-size: 12px;
		font-weight: 500;
		color: var(--muted);
	}
	.total {
		font-size: 12px;
		color: var(--ink-2);
	}
	ol {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	li {
		display: grid;
		grid-template-columns: minmax(0, 1.25fr) minmax(40px, 1fr) 52px;
		align-items: center;
		gap: 10px;
		font-size: 12.5px;
	}
	.who {
		display: flex;
		align-items: center;
		gap: 7px;
		min-width: 0;
	}
	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.bar {
		height: 8px;
		background: var(--surface-2);
		border-radius: 4px;
		overflow: hidden;
	}
	.fill {
		display: block;
		height: 100%;
		border-radius: 4px;
	}
	.fill.x {
		background: var(--accent);
	}
	.fill.m {
		background: var(--gold);
	}
	.share {
		text-align: right;
		font-size: 12px;
	}
	.note {
		font-size: 11.5px;
		color: var(--muted);
	}
</style>
