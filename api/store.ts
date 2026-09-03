// The .js extension is required, not cosmetic: package.json sets "type": "module",
// so these run as ESM on Vercel and Node's resolver rejects an extensionless
// relative specifier at load time — which surfaces as FUNCTION_INVOCATION_FAILED.
import { getRaw, isAllowedKey, setRaw, storeMode } from './_kv.js';

/**
 * Minimal document store for the platform.
 *
 *   GET  /api/store?key=workspace           → { mode, value }
 *   PUT  /api/store?key=progress:<learner>  → { mode, ok: true }
 *
 * Only two key shapes are accepted (see isAllowedKey), so this is not a general KV proxy.
 *
 * Note for whoever operates this: there is no authentication here. Protect the
 * deployment itself (Vercel Deployment Protection / SSO, or an org-only domain) before
 * putting real learner data in. See README, "אבטחה והרשאות".
 */

interface Req {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface Res {
  status: (code: number) => Res;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
}

const MAX_BYTES = 512 * 1024;

export default async function handler(req: Req, res: Res): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');

  const raw = req.query.key;
  const key = Array.isArray(raw) ? raw[0] : raw;

  if (!isAllowedKey(key)) {
    res.status(400).json({ error: 'unsupported key' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const value = await getRaw(key);
      res.status(200).json({ mode: storeMode, value: value ? JSON.parse(value) : null });
    } catch (error) {
      res.status(502).json({ error: String(error) });
    }
    return;
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? null);
    if (payload.length > MAX_BYTES) {
      res.status(413).json({ error: 'payload too large' });
      return;
    }
    try {
      await setRaw(key, payload);
      res.status(200).json({ mode: storeMode, ok: true });
    } catch (error) {
      res.status(502).json({ error: String(error) });
    }
    return;
  }

  res.setHeader('Allow', 'GET, PUT, POST');
  res.status(405).json({ error: 'method not allowed' });
}
