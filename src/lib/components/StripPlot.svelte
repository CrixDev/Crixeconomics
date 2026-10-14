<script lang="ts">
	import { getCountry } from '$lib/countries';
	import type { Peer } from '$lib/types';

	let {
		peers,
		highlight,
		median = null,
		format
	}: {
		peers: Peer[];
		highlight: string;
		median?: number | null;
		format: (v: number) => string;
	} = $props();

	const height = 30;
	const pad = 6;
	let width = $state(0);

	const range = $derived.by(() => {
		const vs = peers.map((p) => p.value);
		let [min, max] = [Math.min(...vs), Math.max(...vs)];
		if (min === max) [min, max] = [min - 1, max + 1];
		return { min, max };
	});

	const x = (v: number) => pad + ((v - range.min) / (range.max - range.min)) * (width - pad * 2);
	const me = $derived(peers.find((p) => p.iso3 === highlight));
	const others = $derived(peers.filter((p) => p.iso3 !== highlight));
	const name = (iso3: string) => getCountry(iso3)?.name ?? iso3;
</script>

{#if peers.length > 1}
	<div class="strip" bind:clientWidth={width}>
		{#if width > 0}
			<svg {width} {height} viewBox="0 0 {width} {height}" aria-hidden="true">
				<line class="axis" x1={pad} x2={width - pad} y1={height / 2} y2={height / 2} />
				{#if median != null}
					<line class="median" x1={x(median)} x2={x(median)} y1="5" y2={height - 5} />
				{/if}
				{#each others as p (p.iso3)}
					<circle class="peer" cx={x(p.value)} cy={height / 2} r="3.5">
						<title>{name(p.iso3)}: {format(p.value)} ({p.label})</title>
					</circle>
				{/each}
				{#if me}
					<circle class="me" cx={x(me.value)} cy={height / 2} r="5.5">
						<title>{name(me.iso3)}: {format(me.value)} ({me.label})</title>
					</circle>
				{/if}
			</svg>
		{/if}
		<div class="ends num">
			<span>{format(range.min)}</span>
			<span>{format(range.max)}</span>
		</div>
	</div>
{/if}

<style>
	.strip {
		width: 100%;
		min-width: 0;
	}
	svg {
		display: block;
		overflow: visible;
	}
	.axis {
		stroke: var(--rule);
		stroke-width: 1;
	}
	.median {
		stroke: var(--muted);
		stroke-width: 1;
		stroke-dasharray: 2 2;
	}
	.peer {
		fill: color-mix(in srgb, var(--ink) 18%, transparent);
		stroke: var(--surface);
		stroke-width: 1;
	}
	.peer:hover {
		fill: var(--ink-2);
	}
	.me {
		fill: var(--highlight);
		stroke: var(--surface);
		stroke-width: 2;
	}
	.ends {
		display: flex;
		justify-content: space-between;
		font-size: 10.5px;
		color: var(--muted);
		margin-top: -2px;
	}
</style>
