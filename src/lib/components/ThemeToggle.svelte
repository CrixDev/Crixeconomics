<script lang="ts">
	import { onMount } from 'svelte';

	type Theme = 'auto' | 'light' | 'dark';
	const ORDER: Theme[] = ['auto', 'light', 'dark'];
	const LABEL: Record<Theme, string> = { auto: 'Auto', light: 'Claro', dark: 'Oscuro' };

	let theme = $state<Theme>('auto');

	onMount(() => {
		try {
			const saved = localStorage.getItem('theme');
			if (saved === 'light' || saved === 'dark') theme = saved;
		} catch {
			/* almacenamiento bloqueado */
		}
	});

	function cycle() {
		theme = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
		const root = document.documentElement;
		if (theme === 'auto') delete root.dataset.theme;
		else root.dataset.theme = theme;
		try {
			if (theme === 'auto') localStorage.removeItem('theme');
			else localStorage.setItem('theme', theme);
		} catch {
			/* almacenamiento bloqueado */
		}
	}
</script>

<button class="toggle" onclick={cycle} title="Cambiar tema" aria-label="Tema: {LABEL[theme]}">
	<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
		<circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.5" />
		{#if theme === 'auto'}
			<path d="M10 3a7 7 0 0 1 0 14z" fill="currentColor" />
		{:else if theme === 'dark'}
			<circle cx="10" cy="10" r="7" fill="currentColor" />
		{/if}
	</svg>
	<span>{LABEL[theme]}</span>
</button>

<style>
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: none;
		border: 1px solid var(--rule-strong);
		border-radius: 99px;
		padding: 5px 11px;
		font-size: 12px;
		cursor: pointer;
		color: var(--ink-2);
	}
	.toggle:hover {
		border-color: var(--ink-2);
	}
</style>
