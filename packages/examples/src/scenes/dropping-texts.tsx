import {makeScene2D, Txt, Layout, Rect} from '@revideo/2d';
import {createRef, tween, waitFor, loop, all, linear, Color, spawn} from '@revideo/core';

export default makeScene2D('dropping-texts', function* (view) {
  // Component references for the text elements
  const backgroundRef = createRef<Rect>();
  const developersRef = createRef<Txt>();
  const designersRef = createRef<Txt>();
  const codersRef = createRef<Txt>();
  const everyoneRef = createRef<Txt>();
  
  // Background colors array matching CSS keyframes
  const backgroundColors = [
    '#ff0075', // 0%
    '#0094ff', // 3-20%
    '#b200ff', // 23-40%
    '#8BC34A', // 43-60%
    '#F44336', // 63-100%
  ];
  
  // Set up the main layout with background
  view.add(
    <Layout
      width={'100%'}
      height={'100%'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      {/* Background rectangle for color animation */}
      <Rect
        ref={backgroundRef}
        width={'100%'}
        height={'100%'}
        fill={backgroundColors[0]}
        zIndex={-1}
      />
      
      {/* Main text layout */}
      <Layout
        direction={'row'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={50}
      >
        {/* Static "UX works for" text */}
        <Txt
          text="UX works for"
          fontSize={80}
          fontFamily="Roboto"
          fontWeight={100}
          fill="#ffffff"
          position={[-360, 0]}
        />
        
        {/* Container for dropping texts */}
        <Layout
          width={400}
          height={80}
          alignItems={'start'}
          justifyContent={'start'}
          position={[100, -2]} // moved to the right
        >
          {/* Dropping text elements - initially hidden */}
          <Txt
            ref={developersRef}
            text="Developers"
            fontSize={0}
            fontFamily="Roboto"
            fontWeight={300}
            fill="#ffffff"
            opacity={0}
            position={[-50, 0]}
            rotation={-25}
            shadowBlur={25}
            shadowOffset={[0, 60]}
            shadowColor="rgba(0,0,0,0.5)"
            zIndex={1}
          />
          
          <Txt
            ref={designersRef}
            text="Designers"
            fontSize={0}
            fontFamily="Roboto"
            fontWeight={300}
            fill="#ffffff"
            opacity={0}
            position={[-50, 0]}
            rotation={-25}
            shadowBlur={25}
            shadowOffset={[0, 60]}
            shadowColor="rgba(0,0,0,0.5)"
            zIndex={1}
          />
          
          <Txt
            ref={codersRef}
            text="Coders"
            fontSize={0}
            fontFamily="Roboto"
            fontWeight={300}
            fill="#ffffff"
            opacity={0}
            position={[-50, 0]}
            rotation={-25}
            shadowBlur={25}
            shadowOffset={[0, 60]}
            shadowColor="rgba(0,0,0,0.5)"
            zIndex={1}
          />
          
          <Txt
            ref={everyoneRef}
            text="EVERYONE!"
            fontSize={0}
            fontFamily="Roboto"
            fontWeight={300}
            fill="#ffffff"
            opacity={0}
            position={[-50, 0]}
            rotation={-25}
            shadowBlur={25}
            shadowOffset={[0, 60]}
            shadowColor="rgba(0,0,0,0.5)"
            zIndex={1}
          />
        </Layout>
      </Layout>
    </Layout>
  );

  // Background color animation function
  function* animateBackground() {
    yield* tween(5, value => {
      let currentColor = backgroundColors[0];
      
      if (value <= 0.03) {
        // 0-3%: #ff0075 to #0094ff
        const progress = value / 0.03;
        currentColor = Color.lerp('#ff0075', '#0094ff', progress).hex();
      } else if (value <= 0.20) {
        // 3-20%: stay #0094ff
        currentColor = '#0094ff';
      } else if (value <= 0.23) {
        // 20-23%: #0094ff to #b200ff
        const progress = (value - 0.20) / 0.03;
        currentColor = Color.lerp('#0094ff', '#b200ff', progress).hex();
      } else if (value <= 0.40) {
        // 23-40%: stay #b200ff
        currentColor = '#b200ff';
      } else if (value <= 0.43) {
        // 40-43%: #b200ff to #8BC34A
        const progress = (value - 0.40) / 0.03;
        currentColor = Color.lerp('#b200ff', '#8BC34A', progress).hex();
      } else if (value <= 0.60) {
        // 43-60%: stay #8BC34A
        currentColor = '#8BC34A';
      } else if (value <= 0.63) {
        // 60-63%: #8BC34A to #F44336
        const progress = (value - 0.60) / 0.03;
        currentColor = Color.lerp('#8BC34A', '#F44336', progress).hex();
      } else {
        // 63-100%: stay #F44336
        currentColor = '#F44336';
      }
      
      backgroundRef().fill(currentColor);
    });
  }

  // Standard roll animation for first 3 texts
  function* createRollAnimation(textRef: typeof developersRef, delay: number) {
    yield* waitFor(delay);
    
    yield* tween(5, value => {
      if (value <= 0.03) {
        // 0-3%: fade in and rotate to 0
        const progress = value / 0.03;
        textRef().opacity(progress);
        textRef().rotation(linear(progress, -25, 0));
      } else if (value <= 0.05) {
        // 3-5%: scale to full size and move to position
        const progress = (value - 0.03) / 0.02;
        textRef().fontSize(linear(progress, 0, 80));
        textRef().opacity(1);
        textRef().position([linear(progress, -50, 0), 0]);
        textRef().rotation(0);
      } else if (value <= 0.20) {
        // 5-20%: stay visible and in position
        textRef().fontSize(80);
        textRef().opacity(1);
        textRef().position([0, 0]);
        textRef().rotation(0);
      } else if (value <= 0.27) {
        // 20-27%: shrink and move down
        const progress = (value - 0.20) / 0.07;
        textRef().fontSize(linear(progress, 80, 0));
        textRef().opacity(linear(progress, 1, 0.5));
        textRef().position([linear(progress, 0, 20), linear(progress, 0, 100)]);
      } else {
        // 27-100%: fade out and reset position
        const progress = (value - 0.27) / 0.73;
        textRef().fontSize(0);
        textRef().opacity(linear(progress, 0.5, 0));
        textRef().position([linear(progress, 20, -50), linear(progress, 100, 0)]);
        textRef().rotation(linear(progress, 0, 15));
      }
    });
  }

  // Special roll2 animation for "EVERYONE!"
  function* createRoll2Animation(textRef: typeof everyoneRef, delay: number) {
    yield* waitFor(delay);
    
    yield* tween(5, value => {
      if (value <= 0.03) {
        // 0-3%: fade in and rotate to 0
        const progress = value / 0.03;
        textRef().opacity(progress);
        textRef().rotation(linear(progress, -25, 0));
      } else if (value <= 0.05) {
        // 3-5%: scale to full size and move to position
        const progress = (value - 0.03) / 0.02;
        textRef().fontSize(linear(progress, 0, 80));
        textRef().opacity(1);
        textRef().position([linear(progress, -50, 0), 0]);
        textRef().rotation(0);
      } else if (value <= 0.30) {
        // 5-30%: stay visible and in position (longer than roll)
        textRef().fontSize(80);
        textRef().opacity(1);
        textRef().position([0, 0]);
        textRef().rotation(0);
      } else if (value <= 0.37) {
        // 30-37%: explosive exit - scale huge and move off screen
        const progress = (value - 0.30) / 0.07;
        textRef().fontSize(linear(progress, 80, 1500));
        textRef().opacity(linear(progress, 1, 0));
        textRef().position([linear(progress, 0, -1000), linear(progress, 0, -800)]);
      } else {
        // 37-100%: reset to initial state
        const progress = (value - 0.37) / 0.63;
        textRef().fontSize(0);
        textRef().opacity(0);
        textRef().position([linear(progress, -1000, -50), linear(progress, -800, 0)]);
        textRef().rotation(linear(progress, 0, 15));
      }
    });
  }

  // Start the infinite animation loop
  yield loop(Infinity, function* () {
    yield* all(
      // Background color cycling
      animateBackground(),
      
      // Text animations with staggered delays
      createRollAnimation(developersRef, 0), // 0s delay
      createRollAnimation(designersRef, 1), // 1s delay  
      createRollAnimation(codersRef, 2), // 2s delay
      createRoll2Animation(everyoneRef, 3) // 3s delay
    );
  });
  
  // Keep scene running to show animations in timeline
  yield* waitFor(15);
});
