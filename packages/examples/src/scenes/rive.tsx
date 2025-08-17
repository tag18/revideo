import {Rive, Rect, Txt, makeScene2D} from '@revideo/2d';
import {createRef, waitFor} from '@revideo/core';

export default makeScene2D('rive', function* (view) {
  // Create a reference to the Rive component
  const riveRef = createRef<Rive>();

  view.add(
    <Rect
      width={'100%'}
      height={'100%'}
      fill={'#1a1a1a'}
      layout
      direction={'column'}
      justifyContent={'center'}
      alignItems={'center'}
      gap={40}
    >
      <Txt
        text="Simple Loader Rive Animation"
        fontSize={48}
        fill={'white'}
        fontFamily={'JetBrains Mono, monospace'}
      />
      <Rive
        ref={riveRef}
        src="/simple_loader.riv"
        width={400}
        height={400}
        artboardId={0}
        animationId={0}
      />
    </Rect>,
  );

  // Wait for the animation to play for a few seconds
  yield* waitFor(4);
});
