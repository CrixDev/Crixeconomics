<script lang="ts">
	let { height = 120, label = 'Cargando datos…' }: { height?: number; label?: string } = $props();
</script>

<div class="skeleton" style:min-height="{height}px" role="status" aria-live="polite">
	<span>{label}</span>
</div>

<style>
	.skeleton {
		border-radius: var(--radius);
		border: 1px solid var(--rule);
		background: linear-gradient(
			100deg,
			var(--surface) 30%,
			color-mix(in srgb, var(--surface-2) 70%, var(--surface)) 50%,
			var(--surface) 70%
		);
		background-size: 300% 100%;
		animation: shimmer 1.6s ease-in-out infinite;
		display: flex;
		align-items: flex-end;
		padding: 12px 16px;
	}
	span {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--muted);
	}
	@keyframes shimmer {
		from {
			background-position: 100% 0;
		}
		to {
			background-position: 0 0;
		}
	}
</style>
