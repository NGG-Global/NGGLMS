/**
 * Scene kind -> component.
 *
 * Twelve of the thirteen kinds in the content model are built: everything nuggets 1
 * to 4 use. The last one (`stairs`) fails the render with a named error rather than
 * falling back to a generic text card. A placeholder that renders is a
 * placeholder that ships, and the point of the redesign is that every beat gets a
 * picture built for what it says — so a kind gets built when the nugget that needs it
 * is produced.
 */

import type { SceneProps } from '../lib/scene';
import { ButlistSceneView } from './ButlistScene';
import { ChipsSceneView } from './ChipsScene';
import { DialSceneView } from './DialScene';
import { FlowSceneView } from './FlowScene';
import { GaugeSceneView } from './GaugeScene';
import { MockSceneView } from './MockScene';
import { NegspaceSceneView } from './NegspaceScene';
import { PrincipleSceneView } from './PrincipleScene';
import { QuestionsSceneView } from './QuestionsScene';
import { QuoteSceneView } from './QuoteScene';
import { TwoqSceneView } from './TwoqScene';
import { TypeSceneView } from './TypeScene';

export const SceneView = (props: SceneProps) => {
  const { scene } = props;
  switch (scene.kind) {
    case 'type':
      return <TypeSceneView {...props} scene={scene} />;
    case 'chips':
      return <ChipsSceneView {...props} scene={scene} />;
    case 'flow':
      return <FlowSceneView {...props} scene={scene} />;
    case 'negspace':
      return <NegspaceSceneView {...props} scene={scene} />;
    case 'mock':
      return <MockSceneView {...props} scene={scene} />;
    case 'questions':
      return <QuestionsSceneView {...props} scene={scene} />;
    case 'principle':
      return <PrincipleSceneView {...props} scene={scene} />;
    case 'gauge':
      return <GaugeSceneView {...props} scene={scene} />;
    case 'butlist':
      return <ButlistSceneView {...props} scene={scene} />;
    case 'twoq':
      return <TwoqSceneView {...props} scene={scene} />;
    case 'dial':
      return <DialSceneView {...props} scene={scene} />;
    case 'quote':
      return <QuoteSceneView {...props} scene={scene} />;
    default:
      throw new Error(
        `No visualizer built for scene kind "${scene.kind}". Build it in remotion/scenes/ ` +
          `before rendering a nugget that uses it.`,
      );
  }
};
