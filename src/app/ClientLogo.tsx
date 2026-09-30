import type { CSSProperties } from 'react';
import { useStore } from '../state/store';
import { monogram } from './brand';

interface Props {
  client: string;
  /** Square side in px. */
  size?: number;
  radius?: number;
  /** For logos on the dark learner hero, where the monogram needs a lighter tile. */
  tone?: 'light' | 'dark';
}

/** The client's uploaded logo, or its monogram when none has been uploaded. */
export function ClientLogo({ client, size = 34, radius = 10, tone = 'light' }: Props) {
  const { logoFor } = useStore();
  const logo = logoFor(client);
  const style: CSSProperties = { width: size, height: size, borderRadius: radius };
  if (logo) {
    return <img className="clientlogo" src={logo.src} alt={`לוגו ${client}`} style={style} draggable={false} />;
  }
  return (
    <span
      className="mono-badge"
      data-tone={tone}
      aria-hidden
      style={{ ...style, fontSize: Math.max(11, Math.round(size * 0.38)) }}
    >
      {monogram(client)}
    </span>
  );
}
