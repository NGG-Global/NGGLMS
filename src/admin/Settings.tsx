import { useStore } from '../state/store';
import { allUnitHealth, narrationTracks } from '../content';
import { formatTime } from '../player/timeline';
import { AdminLayout } from './AdminLayout';

const MODE_LABEL = {
  server: 'מאגר מנוהל',
  'server-volatile': 'API בלי מאגר קבוע',
  local: 'דפדפן בלבד',
} as const;

/** Workspace settings, plus the two things an operator actually needs to see:
 *  where data is stored, and which narration files are missing. */
export function Settings() {
  const { workspace, persistenceStatus } = useStore();
  const health = allUnitHealth();
  const missing = health.flatMap((h) => h.silentSegments);
  const missingFiles = [...new Set(missing.map((s) => s.src))];

  return (
    <AdminLayout crumb="הגדרות">
      <main className="page page--narrow">
        <div className="page__head">
          <div>
            <h1>הגדרות מרחב העבודה</h1>
            <p>אחסון נתונים, מצב התוכן ופרטי הפריסה.</p>
          </div>
        </div>

        <section className="card card--pad" style={{ marginBottom: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            אחסון נתונים
          </div>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <span
              className={`pill${persistenceStatus.mode === 'server' ? ' pill--ok' : persistenceStatus.mode === 'local' ? ' pill--warn' : ' pill--warn'}`}
            >
              {MODE_LABEL[persistenceStatus.mode]}
            </span>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{persistenceStatus.note}</span>
          </div>
          <p style={{ marginTop: 10, fontSize: 12.5, color: 'var(--ink-4)', lineHeight: 1.6 }}>
            לפריסה על Vercel: חיבור Vercel KV (או Upstash Redis) והגדרת המשתנים
            <code className="mono"> KV_REST_API_URL</code> ו־<code className="mono">KV_REST_API_TOKEN</code>{' '}
            מעבירים את הנתונים למאגר משותף וקבוע. בפריסת GitHub Pages אין שרת, ולכן הנתונים נשמרים
            בדפדפן של כל משתמש בנפרד.
          </p>
        </section>

        <section className="card card--pad" style={{ marginBottom: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            מצב התוכן
          </div>
          {health.map((unit) => (
            <div key={unit.contentId} style={{ marginBottom: 14 }}>
              <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                <b style={{ fontSize: 14 }}>
                  יחידה {unit.unitNumber} · {unit.title}
                </b>
                <span className="spacer" />
                <span className={`pill${unit.silentSegments.length ? ' pill--warn' : ' pill--ok'}`}>
                  {unit.silentSegments.length
                    ? `${unit.silentSegments.length} מקטעים ללא קריינות`
                    : 'קריינות מלאה'}
                </span>
              </div>
              {unit.segments.map((segment) => (
                <div key={segment.segmentId} className="healthrow">
                  <div>
                    <b>
                      {segment.n}. {segment.title}
                    </b>
                    <span>
                      {formatTime(segment.durationSec)} · {segment.cueCount} כתוביות ·{' '}
                      {segment.sceneCount} סצנות · {segment.src.split('/').pop()}
                    </span>
                  </div>
                  <span className={`pill${segment.hasAudio ? ' pill--ok' : ' pill--warn'}`}>
                    {segment.hasAudio ? '✓ קריינות' : 'חסר קובץ'}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </section>

        {missingFiles.length > 0 && (
          <div className="banner banner--warn" style={{ marginBottom: 18 }}>
            <span>
              <strong>כדי להשלים את הקריינות:</strong> להוסיף את הקבצים{' '}
              {missingFiles.map((f) => (
                <code key={f} className="mono">
                  {f}{' '}
                </code>
              ))}
              לתיקייה <code className="mono">public/assets/audio/</code>, להריץ{' '}
              <code className="mono">npm run scan:audio</code> ולפרוס מחדש. הכתוביות והאנימציות
              כבר מוגדרות ויסתנכרנו אוטומטית.
            </span>
          </div>
        )}

        <section className="card card--pad" style={{ marginBottom: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            קבצי קריינות בספרייה
          </div>
          <table className="grid">
            <thead>
              <tr>
                <th>קובץ</th>
                <th>אורך</th>
                <th>גודל</th>
              </tr>
            </thead>
            <tbody>
              {narrationTracks.map((track) => (
                <tr key={track.file}>
                  <td className="mono" style={{ fontSize: 12 }} dir="ltr">
                    {track.file}
                  </td>
                  <td>{formatTime(track.duration)}</td>
                  <td>{(track.bytes / 1024 / 1024).toFixed(1)} MB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card card--pad">
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            אבטחה והרשאות
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--ink-2)' }}>
            ההזדהות באפליקציה מזהה משתמשים לצורך מעקב התקדמות והפרדה בין צד הלומד לצד הניהול. היא
            אינה אימות: אין סיסמה ואין בדיקה בצד השרת. לפני הכנסת נתוני לומדים אמיתיים יש להגן על
            הפריסה עצמה — Vercel Deployment Protection או SSO ארגוני (Entra ID) — ולא להסתמך על
            הקישור בלבד.
          </p>
          <p style={{ marginTop: 8, fontSize: 12.5, color: 'var(--ink-4)' }}>
            עדכון אחרון של מרחב העבודה: {new Date(workspace.updatedAt).toLocaleString('he-IL')}
          </p>
        </section>
      </main>
    </AdminLayout>
  );
}
