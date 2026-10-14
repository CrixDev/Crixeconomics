<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { COUNTRIES } from '$lib/countries';

	const sorted = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, 'es'));
	const current = $derived(page.params.iso3?.toUpperCase() ?? '');
</script>

<label class="picker">
	<span class="visually-hidden">Ir a un país</span>
	<select
		class="select"
		value={current}
		onchange={(e) => {
			const iso3 = e.currentTarget.value;
			if (iso3) goto(`/pais/${iso3.toLowerCase()}`);
		}}
	>
		<option value="" disabled>Elige un país…</option>
		{#each sorted as c (c.iso3)}
			<option value={c.iso3}>{c.name}</option>
		{/each}
	</select>
</label>

<style>
	.picker select {
		min-width: 180px;
		font-size: 14px;
		padding-top: 6px;
		padding-bottom: 6px;
	}
	@media (max-width: 640px) {
		.picker select {
			min-width: 0;
			width: 100%;
		}
	}
</style>
