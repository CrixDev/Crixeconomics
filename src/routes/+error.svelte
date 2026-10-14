<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} · Crixeconomics</title>
</svelte:head>

<div class="container wrap">
	<p class="kicker num">Error {page.status}</p>
	<h1>{page.status === 404 ? 'Aquí no hay datos' : 'Algo salió mal'}</h1>
	<p>{page.error?.message ?? 'Error inesperado.'}</p>
	<a href="/">← Volver al panorama regional</a>
</div>

<style>
	.wrap {
		padding-top: 80px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		align-items: flex-start;
	}
	h1 {
		font-size: clamp(36px, 6vw, 60px);
	}
	p {
		color: var(--ink-2);
	}
	a {
		color: var(--accent);
	}
</style>
