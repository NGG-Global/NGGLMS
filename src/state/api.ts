import type { Workspace } from './types';

export type PersistenceMode = 'server' | 'server-volatile' | 'local';

export interface PersistenceStatus {
  mode: PersistenceMode;
  /** Human-readable explanation, shown to the operator in admin settings. */
  note: string;
}

const LOCAL_KEY = 'ngglms:workspace:v1';

/**
 * Talks to /api/store when the deployment has it, and to localStorage when it does not.
 *
 * That is what lets one build run on Vercel (with a KV binding, durable and shared) and
 * on GitHub Pages (static, per-browser) without a second code path. The resolved mode is
 * reported rather than hidden, so nobody assumes durability the deployment does not have.
 */
class Persistence {
  private status: PersistenceStatus = { mode: 'local', note: 'נבדק…' };
  private probed: Promise<PersistenceStatus> | null = null;

  async probe(): Promise<PersistenceStatus> {
    if (this.probed) return this.probed;
    this.probed = (async () => {
      try {
        const res = await fetch('/api/health', { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { store?: string; durable?: boolean };
        this.status = body.durable
          ? { mode: 'server', note: 'נתונים נשמרים במאגר מנוהל (Vercel KV) ומשותפים לכל המשתמשים.' }
          : {
              mode: 'server-volatile',
              note: 'ה-API פעיל אך לא מחובר למאגר קבוע. הנתונים לא נשמרים בין הפעלות — חברו Vercel KV.',
            };
      } catch {
        this.status = {
          mode: 'local',
          note: 'אין API בפריסה הזאת. הנתונים נשמרים בדפדפן של המשתמש בלבד ולא משותפים.',
        };
      }
      return this.status;
    })();
    return this.probed;
  }

  currentStatus(): PersistenceStatus {
    return this.status;
  }

  private readLocal(): Workspace | null {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? (JSON.parse(raw) as Workspace) : null;
    } catch {
      return null;
    }
  }

  private writeLocal(workspace: Workspace): void {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(workspace));
    } catch {
      // Private-mode or quota-exceeded: the session still works, it just will not persist.
    }
  }

  async load(): Promise<Workspace | null> {
    const status = await this.probe();
    if (status.mode !== 'local') {
      try {
        const res = await fetch('/api/store?key=workspace', { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const body = (await res.json()) as { value: Workspace | null };
          if (body.value) return body.value;
        }
      } catch {
        // Fall through to the local copy.
      }
    }
    return this.readLocal();
  }

  /** Writes locally first so the UI is never blocked on the network, then syncs up. */
  async save(workspace: Workspace): Promise<void> {
    this.writeLocal(workspace);
    if (this.status.mode === 'local') return;
    try {
      await fetch('/api/store?key=workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspace),
      });
    } catch {
      // Kept locally; the next successful save will carry it.
    }
  }
}

export const persistence = new Persistence();
