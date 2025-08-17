import {Lottie, Rect, Txt, Layout, makeScene2D} from '@revideo/2d';
import {all, createRef, waitFor} from '@revideo/core';

export default makeScene2D('lottie', function* (view) {
  const lottieRef = createRef<Lottie>();

  // Animation file information
  const animations = [
    { src: '/lottie-heart.json', title: 'Heart Animation' },
  ];

  view.add(
    <Rect
      width={'100%'}
      height={'100%'}
      fill={'#1f09ecff'}
      layout
      direction={'column'}
      justifyContent={'center'}
      alignItems={'center'}
      gap={30}
    >
      <Txt
        text="Multi Lottie Animation Showcase"
        fontSize={48}
        fill={'white'}
        fontWeight={700}
      />
      
      <Lottie
        ref={lottieRef}
        src={"/lottie-heart.json"}
        width={250}
        height={250}
        speed={1}
        autoplay={true}
        loop={true}
        stroke={'#E91E63'}
        lineWidth={2}
        /> 
      
      <Txt
        text="Powered by Lottie Web"
        fontSize={24}
        fill={'#888'}
        fontStyle={'italic'}
      />
    </Rect>,
  );

  // Wait one second for animation to start
  yield* waitFor(1);
  
  // Scale all animations simultaneously
  yield* all(
    lottieRef().scale(1.2, 1)
  );

  yield* waitFor(0.5);

  // Rotation animation - different rotation angles for each animation
  yield* all(
    lottieRef().rotation(90, 1.5)
  );

  yield* waitFor(2);

  // Reset all properties
  yield* all(
    lottieRef().scale(1, 1),
    lottieRef().rotation(0, 1)
  );
  yield* waitFor(3);
});
