import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { assetUrl } from './paths';
import './signin.css';

/**
 * Identity gate.
 *
 * This records who is using the platform so progress can be attributed and the admin
 * side can be separated from the learner side. It is NOT authentication: there is no
 * password and no server-side check. Put the deployment behind real access control
 * (Vercel Deployment Protection / SSO, or an internal domain) before real learner data
 * goes in — see "אבטחה והרשאות" in the README.
 */
export function SignIn() {
  const { signIn } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [org, setOrg] = useState('');
  const [role, setRole] = useState<'learner' | 'admin'>('learner');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim()) return;
    signIn({ name: name.trim(), email: email.trim(), org: org.trim(), role });
    navigate(role === 'admin' ? '/admin' : '/learn', { replace: true });
  };

  return (
    <div className="signin">
      <form className="signin__card card" onSubmit={submit}>
        <img src={assetUrl('assets/ngg-logo.png')} alt="NGG" className="signin__logo" />
        <h1>פלטפורמת הלמידה של NGG</h1>
        <p className="signin__lead">
          מסלולי למידה בבינה מלאכותית לצוותים ולארגונים. הזדהו כדי להמשיך מהמקום שבו עצרתם.
        </p>

        <div className="field">
          <label htmlFor="si-name">שם מלא</label>
          <input id="si-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="si-email">דוא״ל</label>
          <input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
        </div>
        <div className="field">
          <label htmlFor="si-org">
            יחידה ארגונית <span>· אופציונלי</span>
          </label>
          <input id="si-org" type="text" value={org} onChange={(e) => setOrg(e.target.value)} />
        </div>

        <div className="field">
          <label>כניסה בתור</label>
          <div className="chipset">
            <button type="button" aria-pressed={role === 'learner'} onClick={() => setRole('learner')}>
              לומד
            </button>
            <button type="button" aria-pressed={role === 'admin'} onClick={() => setRole('admin')}>
              מנהל תוכן
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn--primary" style={{ marginTop: 4 }}>
          כניסה
        </button>

        <p className="signin__note">
          ההזדהות כאן מזהה את המשתמש לצורך מעקב התקדמות בלבד. אימות אמיתי נעשה בשכבת הפריסה
          (SSO / Entra ID) לפני הכנסת נתוני לומדים אמיתיים.
        </p>
      </form>
    </div>
  );
}
