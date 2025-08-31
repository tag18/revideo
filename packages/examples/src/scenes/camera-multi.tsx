import {Camera, Circle, makeScene2D, Node, Rect} from '@revideo/2d';
import {all, createRef} from '@revideo/core';

export default makeScene2D('camera-multi', function* (view) {
  const camera1 = createRef<Camera>();
  const camera2 = createRef<Camera>();
  const rect = createRef<Rect>();
  const circle = createRef<Circle>();

  // Create a scene that will be rendered by both cameras
  const scene = (
    <Node>
      <Rect
        ref={rect}
        size={80}
        fill={'lightseagreen'}
        position={[-120, -40]}
      />
      <Circle ref={circle} size={60} fill={'hotpink'} position={[120, 40]} />
    </Node>
  );

  view.add(
    <>
      <Camera.Stage
        cameraRef={camera1}
        scene={scene}
        size={[300, 200]}
        position={[-180, 0]}
        fill={'#333'}
        radius={10}
      />
      <Camera.Stage
        cameraRef={camera2}
        scene={scene}
        size={[300, 200]}
        position={[180, 0]}
        fill={'#333'}
        radius={10}
      />
    </>,
  );

  // Both cameras focus on different objects simultaneously
  yield* all(
    camera1().centerOn(rect(), 1),
    camera2().centerOn(circle(), 1)
  );
  
  // Swap their focus
  yield* all(
    camera1().centerOn(circle(), 1),
    camera2().centerOn(rect(), 1)
  );
  
  // Different zoom levels
  yield* all(
    camera1().zoom(1.5, 1),
    camera2().zoom(0.7, 1)
  );
  
  // Reset both cameras
  yield* all(
    camera1().reset(1),
    camera2().reset(1)
  );
});
