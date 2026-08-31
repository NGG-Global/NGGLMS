/**
 * Storage behind the /api endpoints.
 *
 * Prefers a Vercel KV / Upstash Redis binding when the project has one; otherwise
 * falls back to a per-instance in-memory map. The fallback is intentionally honest:
 * `mode` is reported to the client so the admin UI can say the data is not durable
 * rather than implying it is.
 */

export type StoreMode = 'kv' | 'memory';

const REST_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const storeMode: StoreMode = REST_URL && REST_TOKEN ? 'kv' : 'memory';

/** Survives warm invocations only. Cold starts and other instances see an empty map. */
const memory = new Map<string, string>();

const PREFIX = 'ngglms:';

async function rest(path: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`${REST_URL}/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`KV ${path} failed: ${res.status}`);
  const json = (await res.json()) as { result?: unknown };
  return json.result ?? null;
}

export async function getRaw(key: string): Promise<string | null> {
  if (storeMode === 'memory') return memory.get(PREFIX + key) ?? null;
  const result = await rest(`get/${encodeURIComponent(PREFIX + key)}`);
  return typeof result === 'string' ? result : null;
}

export async function setRaw(key: string, value: string): Promise<void> {
  if (storeMode === 'memory') {
    memory.set(PREFIX + key, value);
    return;
  }
  await rest(`set/${encodeURIComponent(PREFIX + key)}`, [value]);
}

export async function delRaw(key: string): Promise<void> {
  if (storeMode === 'memory') {
    memory.delete(PREFIX + key);
    return;
  }
  await rest(`del/${encodeURIComponent(PREFIX + key)}`);
}

/** Keys the API will serve. Anything else is rejected, so the endpoint is not a generic KV proxy. */
const KEY_PATTERN = /^(workspace|progress:[A-Za-z0-9._@%+-]{1,120})$/;

export function isAllowedKey(key: unknown): key is string {
  return typeof key === 'string' && KEY_PATTERN.test(key);
}
