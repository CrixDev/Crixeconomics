<script lang="ts">
	import { unitSuffix } from '$lib/format';
	import { GROUPS, INDICATORS, getMetricDef, SOURCES, type MetricDef } from '$lib/indicators';
	import { RANK_WINDOW_YEARS, STALE_YEARS } from '$lib/stats';

	function code(def: MetricDef): string {
		const f = def.fetch;
		switch (f.kind) {
			case 'wb':
				return f.code;
			case 'imf':
				return f.code;
			case 'owid':
				return f.slug;
			case 'ilo':
				return `${f.flow === 'INEE' ? 'DF_EAR_INEE_CUR_NB' : 'DF_EAR_EMTM_SEX_CUR_NB'} · ${f.cur}`;
			case 'bis':
				return `WS_SPP · Q.R.628${f.transform === 'yoy' ? ' (var. anual)' : ''}`;
			case 'derived':
				return `= ${f.inputs.map((i) => i.replace('@-1', ' (año anterior)')).join(', ')}`;
		}
	}

	const endpoints = [
		{
			path: '/api/metricas',
			desc: 'Catálogo: indicadores, métricas, unidades y código de origen.'
		},
		{
			path: '/api/metricas/gdppc_ppp',
			desc: 'Una métrica para los 20 países: series, ranking y mediana regional.'
		},
		{
			path: '/api/paises/mex',
			desc: 'Perfil de un país: los 20 indicadores, tipo de cambio y socios comerciales.'
		}
	];
</script>

<svelte:head>
	<title>Metodología y fuentes · Crixeconomics</title>
</svelte:head>

<div class="container page">
	<header>
		<p class="kicker">Metodología</p>
		<h1>De dónde sale cada número</h1>
		<p class="lede">
			Crixeconomics no guarda una base propia: cada vista consulta APIs públicas, sin llaves de
			acceso, y conserva las respuestas en memoria unas horas. Así cualquiera puede reproducir las
			cifras yendo a la fuente con el código que aparece abajo.
		</p>
	</header>

	<section class="rules">
		<div>
			<h2>Reglas de comparación</h2>
			<ul>
				<li>
					<b>Cobertura:</b> las 20 repúblicas de América Latina. El Caribe anglófono y los territorios
					quedan fuera en esta versión.
				</li>
				<li>
					<b>Último dato:</b> se toma el último año observado de cada país. Los rankings y la matriz
					solo usan datos de los últimos {RANK_WINDOW_YEARS} años; si un dato tiene más de {STALE_YEARS}
					años se marca como «antiguo».
				</li>
				<li>
					<b>Posición:</b> 1.º es el mejor en métricas con dirección clara (p. ej., menos inflación o
					más esperanza de vida). En las neutrales (población, PIB, composición) solo indica de mayor
					a menor.
				</li>
				<li>
					<b>Proyecciones:</b> las series del World Economic Outlook incluyen estimaciones del FMI para
					el año en curso; se dibujan punteadas y nunca entran al ranking.
				</li>
				<li>
					<b>Mediana regional:</b> se calcula año por año cuando al menos 5 países tienen dato.
				</li>
			</ul>
		</div>
		<div>
			<h2>API propia</h2>
			<p class="muted">Los mismos datos, en JSON, para usarlos en otros proyectos:</p>
			<ul class="endpoints">
				{#each endpoints as e (e.path)}
					<li>
						<a class="num" href={e.path}>{e.path}</a>
						<span>{e.desc}</span>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<section>
		<h2>Fuentes</h2>
		<div class="sources">
			{#each Object.entries(SOURCES) as [id, s] (id)}
				<a class="source" href={s.url} target="_blank" rel="noreferrer">
					<strong>{s.name}</strong>
					<span class="num">{s.api}</span>
				</a>
			{/each}
		</div>
		<p class="muted small">
			La OCDE no se usa en esta versión: su Data Explorer solo cubre a sus cuatro miembros
			latinoamericanos (México, Chile, Colombia y Costa Rica). El IDH, el Índice de Percepción de la
			Corrupción y el World Happiness Report no tienen API abierta propia; se leen a través de Our
			World in Data, que los redistribuye con su licencia original.
		</p>
	</section>

	{#each GROUPS as g (g.id)}
		<section>
			<h2>{g.title}</h2>
			{#each INDICATORS.filter((i) => i.group === g.id) as ind (ind.slug)}
				<article class="ind">
					<h3><span class="num">{String(ind.n).padStart(2, '0')}</span> {ind.title}</h3>
					<p class="muted">{ind.summary}</p>
					<div class="scroller">
						<table>
							<thead>
								<tr>
									<th>Métrica</th>
									<th>Unidad</th>
									<th>Fuente</th>
									<th>Código</th>
								</tr>
							</thead>
							<tbody>
								{#each ind.metrics as id (id)}
									{@const def = getMetricDef(id)}
									<tr>
										<td>
											{def.label}
											{#if id === ind.headline}<span class="tag">principal</span>{/if}
										</td>
										<td class="muted">{unitSuffix(def.unit) || def.hint || '—'}</td>
										<td
											>{def.origin
												? `${def.origin} (vía ${SOURCES[def.via].short})`
												: SOURCES[def.via].short}</td
										>
										<td class="num code">{code(def)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					{#if ind.note}<p class="note">{ind.note}</p>{/if}
					{#each ind.gaps ?? [] as gap (gap)}
						<p class="gap"><span class="kicker">Sin API abierta</span> {gap}</p>
					{/each}
				</article>
			{/each}
		</section>
	{/each}
</div>

<style>
	.page {
		padding-top: 36px;
		display: flex;
		flex-direction: column;
		gap: 44px;
	}
	h1 {
		font-size: clamp(36px, 5vw, 56px);
		margin: 8px 0 12px;
	}
	h2 {
		font-size: 28px;
		margin-bottom: 14px;
	}
	.lede {
		font-size: 17px;
		color: var(--ink-2);
		max-width: 64ch;
	}
	.rules {
		display: grid;
		grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
		gap: 40px;
	}
	.rules ul {
		margin: 0;
		padding-left: 18px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		color: var(--ink-2);
		font-size: 14px;
	}
	.endpoints {
		list-style: none;
		padding: 0 !important;
		margin-top: 10px !important;
	}
	.endpoints li {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 10px 12px;
		background: var(--surface);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
	}
	.endpoints a {
		color: var(--accent);
		font-size: 13px;
	}
	.endpoints span {
		font-size: 13px;
		color: var(--muted);
	}
	.sources {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
		gap: 10px;
		margin-bottom: 14px;
	}
	.source {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 12px 14px;
		background: var(--surface);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		text-decoration: none;
	}
	.source:hover {
		border-color: var(--ink-2);
	}
	.source strong {
		font-weight: 500;
		font-size: 14px;
	}
	.source span {
		font-size: 11px;
		color: var(--muted);
		word-break: break-all;
	}
	.ind {
		padding: 22px 0;
		border-top: 1px solid var(--rule);
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	h3 {
		font-size: 22px;
	}
	h3 .num {
		font-size: 13px;
		color: var(--accent);
		vertical-align: middle;
		margin-right: 6px;
	}
	.scroller {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}
	th,
	td {
		text-align: left;
		padding: 7px 10px;
		border-bottom: 1px solid var(--rule);
		vertical-align: top;
	}
	th {
		font-size: 11px;
		font-weight: 500;
		color: var(--muted);
	}
	.code {
		font-size: 11.5px;
		color: var(--ink-2);
		white-space: nowrap;
	}
	.tag {
		font-family: var(--font-mono);
		font-size: 9.5px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--accent);
		border: 1px solid currentColor;
		border-radius: 4px;
		padding: 0 4px;
		margin-left: 6px;
	}
	.note,
	.gap {
		font-size: 13px;
		color: var(--ink-2);
		max-width: 80ch;
	}
	.muted {
		color: var(--muted);
	}
	.small {
		font-size: 13px;
		max-width: 80ch;
	}
	@media (max-width: 860px) {
		.rules {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
