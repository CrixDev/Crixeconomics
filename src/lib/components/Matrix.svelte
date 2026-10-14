<script lang="ts">
	import { goto } from '$app/navigation';
	import { COUNTRIES, getCountry } from '$lib/countries';
	import { formatValue } from '$lib/format';
	import { GROUPS, getMetricDef, INDICATORS, SHORT_TITLE } from '$lib/indicators';
	import { heat } from '$lib/heat';
	import type { MatrixRow } from '$lib/types';
	import Flag from './Flag.svelte';

	let { rows }: { rows: MatrixRow[] } = $props();

	let sortKey = $state<string>('name');
	let sortDir = $state<1 | -1>(1);

	const columns = INDICATORS.map((ind) => ({ ind, def: getMetricDef(ind.headline) }));
	const groupSpans = GROUPS.map((g) => ({
		g,
		span: INDICATORS.filter((i) => i.group === g.id).length
	}));

	const sorted = $derived.by(() => {
		const list = [...rows];
		if (sortKey === 'name') {
			return list.sort(
				(a, b) => sortDir * getCountry(a.iso3)!.name.localeCompare(getCountry(b.iso3)!.name, 'es')
			);
		}
		return list.sort((a, b) => {
			const va = a.cells[sortKey];
			const vb = b.cells[sortKey];
			if (!va && !vb) return 0;
			if (!va) return 1;
			if (!vb) return -1;
			return sortDir * (vb.value - va.value);
		});
	});

	function sortBy(key: string) {
		if (sortKey === key) sortDir = sortDir === 1 ? -1 : 1;
		else {
			sortKey = key;
			sortDir = 1;
		}
	}
	const ariaSort = (key: string) =>
		sortKey === key
			? sortDir === 1
				? key === 'name'
					? 'ascending'
					: 'descending'
				: key === 'name'
					? 'descending'
					: 'ascending'
			: 'none';
	const names = new Map(COUNTRIES.map((c) => [c.iso3, c]));
</script>

<div class="scroller" role="region" aria-label="Matriz de indicadores por país" tabindex="-1">
	<table>
		<thead>
			<tr class="groups">
				<th class="corner" rowspan="2" aria-sort={ariaSort('name')}>
					<button onclick={() => sortBy('name')}
						>País {sortKey === 'name' ? (sortDir === 1 ? '↑' : '↓') : ''}</button
					>
				</th>
				{#each groupSpans as { g, span } (g.id)}
					<th colspan={span} class="group-cell"><span>{g.title}</span></th>
				{/each}
			</tr>
			<tr class="cols">
				{#each columns as { ind, def } (ind.slug)}
					<th
						aria-sort={ariaSort(def.id)}
						title="{ind.n}. {ind.title} — {def.label}{def.hint ? ` (${def.hint})` : ''}"
					>
						<button onclick={() => sortBy(def.id)}>
							<span class="n num">{ind.n}</span>
							<span class="t">{SHORT_TITLE[ind.slug]}</span>
							{#if sortKey === def.id}<span class="arrow">{sortDir === 1 ? '↓' : '↑'}</span>{/if}
						</button>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sorted as row (row.iso3)}
				{@const c = names.get(row.iso3)!}
				<tr onclick={() => goto(`/pais/${row.iso3.toLowerCase()}`)}>
					<th scope="row" class="country">
						<a href="/pais/{row.iso3.toLowerCase()}" onclick={(e) => e.stopPropagation()}>
							<Flag iso2={c.iso2} size={14} />
							<span>{c.name}</span>
						</a>
					</th>
					{#each columns as { ind, def } (ind.slug)}
						{@const cell = row.cells[def.id]}
						{@const color = heat(cell?.score ?? null, !def.better)}
						<td
							style:background={color.bg}
							style:color={color.ink}
							title={cell
								? `${c.name} · ${def.label}: ${formatValue(cell.value, def, { currency: c.currency })} (${cell.label})`
								: `${c.name} · ${def.label}: sin dato reciente`}
						>
							<span class="num"
								>{cell
									? formatValue(cell.value, def, { currency: c.currency, short: true })
									: '·'}</span
							>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<div class="legend">
	<span class="scale">
		<span>Peor</span>
		<span class="ramp good-bad"></span>
		<span>Mejor</span>
	</span>
	<span class="scale">
		<span>Menor</span>
		<span class="ramp neutral"></span>
		<span>Mayor</span>
		<span class="muted">(sin juicio de valor)</span>
	</span>
	<span class="muted"
		>Posición relativa dentro de la región · último dato de los 10 años recientes · haz clic en un
		encabezado para ordenar</span
	>
</div>

<style>
	.scroller {
		overflow-x: auto;
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		background: var(--surface);
		scrollbar-width: thin;
	}
	table {
		border-collapse: separate;
		border-spacing: 0;
		width: 100%;
		font-size: 12px;
	}
	th,
	td {
		border-bottom: 1px solid var(--rule);
		padding: 0;
	}
	thead th {
		background: var(--surface);
		font-weight: 500;
		vertical-align: bottom;
	}
	.groups th {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
		text-align: left;
		padding: 10px 8px 6px;
		border-left: 1px solid var(--rule);
	}
	.group-cell span {
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}
	.corner {
		position: sticky;
		left: 0;
		z-index: 3;
		text-align: left;
		min-width: 170px;
		border-right: 1px solid var(--rule);
	}
	button {
		background: none;
		border: 0;
		width: 100%;
		height: 100%;
		cursor: pointer;
		padding: 8px;
		text-align: left;
		color: inherit;
	}
	.corner button {
		font-weight: 600;
		font-size: 12.5px;
		padding: 10px 12px;
	}
	.cols th {
		min-width: 74px;
		max-width: 96px;
	}
	.cols button {
		display: flex;
		flex-direction: column;
		gap: 2px;
		line-height: 1.2;
	}
	.cols .n {
		font-size: 10px;
		color: var(--accent);
	}
	.cols .t {
		font-size: 11.5px;
		color: var(--ink-2);
	}
	.cols th:hover {
		background: var(--surface-2);
	}
	.arrow {
		font-size: 10px;
		color: var(--accent);
	}
	tbody tr {
		cursor: pointer;
	}
	tbody tr:hover td {
		filter: brightness(0.96);
	}
	tbody tr:hover .country {
		background: var(--surface-2);
	}
	.country {
		position: sticky;
		left: 0;
		z-index: 1;
		background: var(--surface);
		text-align: left;
		font-weight: 400;
		border-right: 1px solid var(--rule);
	}
	.country a {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 12px;
		text-decoration: none;
		font-size: 13px;
		white-space: nowrap;
	}
	td {
		text-align: right;
		padding: 7px 8px;
		white-space: nowrap;
		border-left: 1px solid color-mix(in srgb, var(--rule) 50%, transparent);
	}
	td .num {
		font-size: 11.5px;
	}
	tbody tr:last-child > * {
		border-bottom: 0;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 22px;
		align-items: center;
		margin-top: 12px;
		font-size: 12px;
		color: var(--ink-2);
	}
	.scale {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.ramp {
		width: 120px;
		height: 10px;
		border-radius: 3px;
	}
	.good-bad {
		background: linear-gradient(
			90deg,
			var(--heat-0),
			var(--heat-1),
			var(--heat-2),
			var(--heat-3),
			var(--heat-4)
		);
	}
	.neutral {
		background: linear-gradient(90deg, var(--neutral-0), var(--neutral-1));
	}
	.muted {
		color: var(--muted);
	}
</style>
