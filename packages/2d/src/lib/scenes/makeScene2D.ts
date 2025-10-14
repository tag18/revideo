import {
  createSceneMetadata,
  type DescriptionOf,
  type ThreadGeneratorFactory,
} from '@revideo/core';
import type {View2D} from '../components';
import {Scene2D} from './Scene2D';

export function makeScene2D(
  name: string,
  runner: ThreadGeneratorFactory<View2D>,
): DescriptionOf<Scene2D> {
  return {
    klass: Scene2D,
    name,
    config: runner,
    stack: new Error().stack,
    meta: createSceneMetadata(),
    plugins: ['@revideo/2d/editor'],
  };
}
