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

/** Every produced nugget, as `<unit>-<nugget>` composition ids. */
const NUGGETS: { id: string; props: NuggetProps }[] = [
  { id: 'u01-n01', props: { contentId: 'unit-01', segmentId: 's1' } },
  { id: 'u01-n02', props: { contentId: 'unit-01', segmentId: 's2' } },
  { id: 'u01-n03', props: { contentId: 'unit-01', segmentId: 's3' } },
  { id: 'u01-n04', props: { contentId: 'unit-01', segmentId: 's4' } },
  { id: 'u01-n05', props: { contentId: 'unit-01', segmentId: 's5' } },
];

export const RemotionRoot = () => (
  <>
    {NUGGETS.map(({ id, props }) => (
      <Composition
        key={id}
        id={id}
        component={NuggetVideo}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        durationInFrames={1}
        defaultProps={props}
        calculateMetadata={({ props: p }) => ({ durationInFrames: nuggetDuration(p) })}
      />
    ))}
  </>
);
