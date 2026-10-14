<script lang="ts">
	import { flagUrl } from '$lib/countries';

	let { iso2, size = 20, alt = '' }: { iso2: string; size?: number; alt?: string } = $props();
</script>

<img
	class="flag"
	src={flagUrl(iso2)}
	{alt}
	width={Math.round(size * 1.4)}
	height={size}
	loading="lazy"
	decoding="async"
/>

<style>
	.flag {
		display: inline-block;
		object-fit: cover;
		border-radius: 3px;
		box-shadow: 0 0 0 1px rgb(0 0 0 / 0.08);
		flex: none;
		background: var(--surface-2);
	}
</style>
