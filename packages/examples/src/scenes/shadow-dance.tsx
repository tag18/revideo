import {Txt, makeScene2D, Layout} from '@revideo/2d';
import {createRef, tween, easeInOutCubic, loop, waitFor} from '@revideo/core';

export default makeScene2D('shadow-dance', function* (view) {
  const mainText = createRef<Txt>();
  const shadow1 = createRef<Txt>();
  const shadow2 = createRef<Txt>();

  // Set background color to match the HTML example
  view.fill('#121212');

  view.add(
    <Layout
      width={'100%'}
      height={'100%'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      {/* Second shadow layer (back) */}
      <Txt
        ref={shadow2}
        text="SHADOW"
        fontSize={256}
        fill="#00d4ff"
        fontFamily="Arial, sans-serif"
        fontWeight={700}
        position={[10, 10]}
        zIndex={1}
      />
      {/* First shadow layer (middle) */}
      <Txt
        ref={shadow1}
        text="SHADOW"
        fontSize={256}
        fill="#ff005e"
        fontFamily="Arial, sans-serif"
        fontWeight={700}
        position={[5, 5]}
        zIndex={2}
      />
      {/* Main text (front) */}
      <Txt
        ref={mainText}
        text="SHADOW"
        fontSize={256}
        fill="#fff"
        fontFamily="Arial, sans-serif"
        fontWeight={700}
        position={[0, 0]}
        zIndex={3}
      />
    </Layout>
  );

  // Create the shadow dance animation loop
  yield loop(Infinity, () => 
    tween(2, value => {
      const progress = easeInOutCubic(value);
      
      if (progress <= 0.5) {
        // First half: transition from initial state to inverted state
        const t = progress * 2; // 0 to 1
        
        // Animate first shadow from [5, 5] to [-5, -5]
        const shadow1X = 5 - (10 * t);
        const shadow1Y = 5 - (10 * t);
        shadow1().position([shadow1X, shadow1Y]);
        
        // Animate second shadow from [10, 10] to [-10, -10]
        const shadow2X = 10 - (20 * t);
        const shadow2Y = 10 - (20 * t);
        shadow2().position([shadow2X, shadow2Y]);
        
        // Swap colors halfway through
        if (t >= 0.5) {
          shadow1().fill("#00d4ff");
          shadow2().fill("#ff005e");
        } else {
          shadow1().fill("#ff005e");
          shadow2().fill("#00d4ff");
        }
        
      } else {
        // Second half: transition back to initial state
        const t = (progress - 0.5) * 2; // 0 to 1
        
        // Animate first shadow from [-5, -5] back to [5, 5]
        const shadow1X = -5 + (10 * t);
        const shadow1Y = -5 + (10 * t);
        shadow1().position([shadow1X, shadow1Y]);
        
        // Animate second shadow from [-10, -10] back to [10, 10]
        const shadow2X = -10 + (20 * t);
        const shadow2Y = -10 + (20 * t);
        shadow2().position([shadow2X, shadow2Y]);
        
        // Swap colors halfway through
        if (t >= 0.5) {
          shadow1().fill("#ff005e");
          shadow2().fill("#00d4ff");
        } else {
          shadow1().fill("#00d4ff");
          shadow2().fill("#ff005e");
        }
      }
    })
  );
  
  // Keep the scene running to show the animation
  yield* waitFor(10);
});
