import { building } from '$app/environment';
import type { ServerInit } from '@sveltejs/kit';
import { warmCache } from '$lib/server/data';

export const init: ServerInit = () => {
	// Precarga las series en segundo plano para que la primera visita no espere a las APIs.
	if (!building) warmCache();
};
