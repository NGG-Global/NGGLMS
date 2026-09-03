// The .js extension is required, not cosmetic: package.json sets "type": "module",
// so these run as ESM on Vercel and Node's resolver rejects an extensionless
// relative specifier at load time — which surfaces as FUNCTION_INVOCATION_FAILED.
import { storeMode } from './_kv.js';

interface Res {
  status: (code: number) => Res;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
}

/**
 * GET /api/health — tells the client whether a durable store is wired up.
 *
 * The client uses this to decide between server-backed persistence and
 * browser-local persistence, and the admin UI shows the answer to the operator.
 */
export default function handler(_req: unknown, res: Res): void {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    store: storeMode,
    durable: storeMode === 'kv',
  });
}
