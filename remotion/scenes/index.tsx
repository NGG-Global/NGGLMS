/**
 * Scene kind -> component.
 *
 * Seven of the thirteen kinds in the content model are built: the seven nugget 1
 * uses. The rest fail the render with a named error rather than falling back to a
 * generic text card. A placeholder that renders is a placeholder that ships, and the
 * point of the redesign is that every beat gets a picture built for what it says —
 * so the next nugget's kinds get built when that nugget is produced.
 */

import type { SceneProps } from '../lib/scene';
import { ChipsSceneView } from './ChipsScene';
import { FlowSceneView } from './FlowScene';
import { MockSceneView } from './MockScene';
import { NegspaceSceneView } from './NegspaceScene';
import { PrincipleSceneView } from './PrincipleScene';
import { QuestionsSceneView } from './QuestionsScene';
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
    default:
      throw new Error(
        `No visualizer built for scene kind "${scene.kind}". Build it in remotion/scenes/ ` +
          `before rendering a nugget that uses it.`,
      );
  }
};
