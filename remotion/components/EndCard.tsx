/**
 * The close.
 *
 * A nugget does not end on a summary — it ends on the reflection prompt the segment
 * already carries in `think`, under the same label the player uses for it
 * ("עצור וחשוב"). Leaving the viewer with a question about their own week is what the
 * curriculum is for, and it is the one thing on screen worth five silent seconds.
 */

import { Img, staticFile, useCurrentFrame } from 'remotion';
import { Micro, Reveal } from '../lib/kit';
import { drift, reveal } from '../lib/motion';
import { font, palette, type } from '../theme';

export const EndCard = ({
  unitTitle,
  nuggetTitle,
  think,
}: {
  unitTitle: string;
  nuggetTitle: string;
  think: string;
}) => {
  const frame = useCurrentFrame();
  const rule = reveal(frame, { delay: 46, duration: 40 });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 38,
        padding: '0 200px',
        direction: 'rtl',
        fontFamily: font.sans,
        textAlign: 'center',
      }}
    >
      <Reveal at={0} duration={30} dy={16} from={0.94}>
        <Img
          src={staticFile('assets/ngg-mark-white.png')}
          style={{
            width: 84,
            height: 74,
            objectFit: 'contain',
            transform: `translateY(${drift(frame, 4, 460)}px)`,
          }}
        />
      </Reveal>

      <Reveal at={12} dy={14}>
        <Micro color="#ff5fa8" size={25}>
          עצור וחשוב
        </Micro>
      </Reveal>

      <Reveal at={20} duration={34} dy={26} blur={7}>
        <div
          style={{
            fontSize: type.sub,
            fontWeight: 700,
            lineHeight: 1.4,
            letterSpacing: '-0.022em',
            color: '#fff',
            maxWidth: 1380,
          }}
        >
          {think}
        </div>
      </Reveal>

      <div
        style={{
          width: 300 * rule,
          height: 4,
          borderRadius: 4,
          background: `linear-gradient(90deg, rgba(0,0,0,0), ${palette.accent})`,
        }}
      />

      <Reveal at={54} dy={12}>
        <Micro color="rgba(255,255,255,0.44)" size={22}>
          {`${unitTitle} · ${nuggetTitle}`}
        </Micro>
      </Reveal>
    </div>
  );
};
