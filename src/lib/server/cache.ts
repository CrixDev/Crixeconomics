type Entry<T> = { value?: T; expires: number; pending?: Promise<T> };

const store = new Map<string, Entry<unknown>>();

/**
 * Memoriza en memoria con TTL. Si el valor expiró se sirve el viejo mientras se
 * recarga en segundo plano (stale-while-revalidate); si la recarga falla se
 * conserva el viejo. Las llamadas concurrentes comparten la misma promesa.
 */
export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
	const entry = store.get(key) as Entry<T> | undefined;
	const now = Date.now();

	if (entry?.value !== undefined && entry.expires > now) return Promise.resolve(entry.value);
	if (entry?.pending)
		return entry.value !== undefined ? Promise.resolve(entry.value) : entry.pending;

	const pending = load().then(
		(value) => {
			store.set(key, { value, expires: Date.now() + ttlMs });
			return value;
		},
		(error) => {
			const current = store.get(key) as Entry<T> | undefined;
			if (current?.value !== undefined) {
				// Reintentar en un minuto sin tirar el dato viejo.
				store.set(key, { value: current.value, expires: Date.now() + 60_000 });
			} else {
				store.delete(key);
			}
			throw error;
		}
	);

	store.set(key, { value: entry?.value, expires: entry?.expires ?? 0, pending });

	if (entry?.value !== undefined) {
		pending.catch(() => {});
		return Promise.resolve(entry.value);
	}
	return pending;
}

export const HOUR = 60 * 60 * 1000;
