const USER_AGENT = 'Crixeconomics/0.1 (indicadores de America Latina; datos abiertos)';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Options = { timeoutMs?: number; retries?: number; headers?: Record<string, string> };

export async function request(url: string, opts: Options = {}): Promise<Response> {
	const { timeoutMs = 25_000, retries = 1, headers = {} } = opts;
	let lastError: unknown;

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const res = await fetch(url, {
				headers: { 'user-agent': USER_AGENT, ...headers },
				signal: AbortSignal.timeout(timeoutMs)
			});
			if (res.ok) return res;
			lastError = new Error(`HTTP ${res.status} en ${new URL(url).host}`);
			// Los 4xx no mejoran reintentando, salvo el 429 (límite de peticiones).
			if (res.status === 429) {
				if (attempt < retries) await sleep(2_500 * (attempt + 1));
				continue;
			}
			if (res.status < 500) break;
		} catch (error) {
			lastError = error;
		}
		if (attempt < retries) await sleep(800 * 2 ** attempt);
	}
	throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function getJson<T>(url: string, opts?: Options): Promise<T> {
	return (await request(url, opts)).json() as Promise<T>;
}

export async function getText(url: string, opts?: Options): Promise<string> {
	return (await request(url, opts)).text();
}
