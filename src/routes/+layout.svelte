<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import CrixLogo from '$lib/components/CrixLogo.svelte';
	import CountryPicker from '$lib/components/CountryPicker.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { SOURCES } from '$lib/indicators';

	let { children } = $props();

	const nav = [
		{ href: '/', label: 'Panorama' },
		{ href: '/comparar', label: 'Comparar' },
		{ href: '/metodologia', label: 'Metodología' }
	];
	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="site">
	<div class="container bar">
		<a class="brand" href="/">
			<span class="mark-with-logo">
				<CrixLogo />
				<span class="mark">Crixeconomics</span>
			</span>
			<span class="tag">Atlas económico de América Latina</span>
		</a>
		<nav aria-label="Principal">
			{#each nav as item (item.href)}
				<a href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>{item.label}</a>
			{/each}
		</nav>
		<div class="tools">
			<CountryPicker />
			<ThemeToggle />
		</div>
	</div>
</header>

<main>
	{@render children()}
</main>

<footer class="site-foot">
	<div class="container foot">
		<div>
			<span class="mark small">Crixeconomics</span>
			<p>
				Todos los datos se consultan en vivo a APIs públicas y se guardan en caché unas horas. Las
				cifras pertenecen a sus fuentes; aquí solo se ordenan y comparan.
			</p>
		</div>
		<div>
			<span class="kicker">Fuentes</span>
			<ul>
				{#each Object.values(SOURCES) as s (s.url)}
					<li><a href={s.url} target="_blank" rel="noreferrer">{s.short}</a></li>
				{/each}
			</ul>
		</div>
	</div>
</footer>

<style>
	.site {
		position: sticky;
		top: 0;
		z-index: 20;
		background: color-mix(in srgb, var(--paper) 88%, transparent);
		backdrop-filter: saturate(1.4) blur(10px);
		-webkit-backdrop-filter: saturate(1.4) blur(10px);
		border-bottom: 1px solid var(--rule);
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 20px;
		min-height: 64px;
		flex-wrap: wrap;
		padding-top: 8px;
		padding-bottom: 8px;
	}
	.brand {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		line-height: 1.1;
	}
	.mark-with-logo {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.mark-with-logo :global(svg) {
		width: 24px;
		height: 24px;
	}
	.mark {
		font-family: var(--font-display);
		font-size: 22px;
		font-weight: 600;
		font-style: italic;
		letter-spacing: -0.02em;
	}
	.mark.small {
		font-size: 18px;
	}
	.tag {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
	}
	nav {
		display: flex;
		gap: 4px;
	}
	nav a {
		text-decoration: none;
		font-size: 14px;
		padding: 6px 12px;
		border-radius: 99px;
		color: var(--ink-2);
	}
	nav a:hover {
		background: var(--surface-2);
	}
	nav a[aria-current='page'] {
		background: var(--ink);
		color: var(--paper);
	}
	.tools {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 10px;
	}
	main {
		min-height: 70vh;
	}
	.site-foot {
		border-top: 1px solid var(--rule);
		margin-top: 64px;
		padding: 36px 0 48px;
		font-size: 13px;
		color: var(--ink-2);
	}
	.foot {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
		gap: 32px;
	}
	.foot p {
		margin-top: 8px;
		max-width: 60ch;
		color: var(--muted);
	}
	.foot ul {
		list-style: none;
		padding: 0;
		margin: 8px 0 0;
		columns: 2;
		gap: 24px;
	}
	.foot li {
		margin-bottom: 4px;
	}
	@media (max-width: 760px) {
		.bar {
			gap: 10px 16px;
		}
		nav {
			order: 3;
			width: 100%;
			overflow-x: auto;
		}
		.tools {
			gap: 8px;
		}
		.foot {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 520px) {
		.tag {
			display: none;
		}
		.tools {
			flex: 1;
			justify-content: flex-end;
		}
	}
</style>
