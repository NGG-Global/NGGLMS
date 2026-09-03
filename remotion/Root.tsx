/**
 * Composition registry.
 *
 * One entry per produced nugget. Duration is not written down here — it is derived
 * from the narration slice through `calculateMetadata`, so a re-cut audio file changes
 * the video's length without anyone remembering to update a number.
 */

import { Composition } from 'remotion';
import { NuggetVideo, nuggetDuration, type NuggetProps } from './NuggetVideo';
import { FPS, HEIGHT, WIDTH } from './theme';
import './fonts';

export const RemotionRoot = () => (
  <Composition
    id="u01-n01"
    component={NuggetVideo}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    durationInFrames={1}
    defaultProps={{ contentId: 'unit-01', segmentId: 's1' } satisfies NuggetProps}
    calculateMetadata={({ props }) => ({ durationInFrames: nuggetDuration(props) })}
  />
);
