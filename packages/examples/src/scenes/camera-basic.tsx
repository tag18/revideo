import {Camera, Circle, makeScene2D, Rect} from '@revideo/2d';
import {createRef} from '@revideo/core';

export default makeScene2D('camera-basic', function* (view) {
  const camera = createRef<Camera>();

  view.add(
    <Camera ref={camera}>
      <Rect size={100} fill={'lightseagreen'} position={[-100, -30]} />
      <Circle size={80} fill={'hotpink'} position={[100, 30]} />
    </Camera>,
  );

  yield* camera().zoom(2, 1);
  yield* camera().zoom(0.5, 1.5);
  yield* camera().zoom(1, 1);
});
