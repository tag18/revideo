import {Txt, makeScene2D, Layout, Img, Node} from '@revideo/2d';
import {createRef, tween, easeInOutCubic, loop, waitFor, all} from '@revideo/core';

// Using the same image from the original request
const ImageSource = 'https://images.unsplash.com/photo-1732535725600-f805d8b33c9c?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMJA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

export default makeScene2D('image-masked-text', function* (view) {
  // Main masked text refs
  const maskTextRef = createRef<Txt>();
  const backgroundImageRef = createRef<Img>();
  
  // Shadow dance refs
  const shadow1Ref = createRef<Txt>();
  const shadow2Ref = createRef<Txt>();

  // Set background color to match the HTML example
  view.fill('#222');

  yield view.add(
    <Layout
      width={'100%'}
      height={'100%'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      {/* Shadow layers behind the main text */}
      {/* Second shadow layer (back) */}
      <Txt
        ref={shadow2Ref}
        text="Masked Animation"
        fontSize={100}
        fill="#00d4ff"
        fontFamily="Arial, sans-serif"
        fontWeight={700}
        position={[10, 10]}
        zIndex={1}
      />
      {/* First shadow layer (middle) */}
      <Txt
        ref={shadow1Ref}
        text="Masked Animation"
        fontSize={100}
        fill="#ff005e"
        fontFamily="Arial, sans-serif"
        fontWeight={700}
        position={[5, 5]}
        zIndex={2}
      />
      
      {/* Main masked text with image background */}
      <Node cache zIndex={3}>
        {/* Stencil/Mask Layer - The text that defines the visible area */}
        <Txt
          ref={maskTextRef}
          text="Masked Animation"
          fontSize={100}
          fontWeight={700}
          fontFamily="Arial, sans-serif"
          fill="#fff"
        />
        {/* Value Layer - The background image that will be visible through the text mask */}
        <Img
          ref={backgroundImageRef}
          src={ImageSource}
          width={1920 * 2} // 200% width for animation, like CSS background-size: 200%
          height={1080}
          x={-960} // Start from left (equivalent to background-position: 0%)
          compositeOperation={'source-in'}
        />
      </Node>
    </Layout>
  );

  // Create combined animation: background movement + shadow dance
  yield loop(Infinity, () => 
    all(
      // Background image movement (5 second cycle)
      tween(5, value => {
        // Move the background image from left to right
        const imageX = -960 + (1920 * value);
        backgroundImageRef().x(imageX);
      }),
      
      // Shadow dance animation (2 second cycle)
      tween(2, value => {
        const progress = easeInOutCubic(value);
        
        if (progress <= 0.5) {
          // First half: transition from initial state to inverted state
          const t = progress * 2; // 0 to 1
          
          // Animate first shadow from [5, 5] to [-5, -5]
          const shadow1X = 5 - (10 * t);
          const shadow1Y = 5 - (10 * t);
          shadow1Ref().position([shadow1X, shadow1Y]);
          
          // Animate second shadow from [10, 10] to [-10, -10]
          const shadow2X = 10 - (20 * t);
          const shadow2Y = 10 - (20 * t);
          shadow2Ref().position([shadow2X, shadow2Y]);
          
          // Swap colors halfway through
          if (t >= 0.5) {
            shadow1Ref().fill("#00d4ff");
            shadow2Ref().fill("#ff005e");
          } else {
            shadow1Ref().fill("#ff005e");
            shadow2Ref().fill("#00d4ff");
          }
          
        } else {
          // Second half: transition back to initial state
          const t = (progress - 0.5) * 2; // 0 to 1
          
          // Animate first shadow from [-5, -5] back to [5, 5]
          const shadow1X = -5 + (10 * t);
          const shadow1Y = -5 + (10 * t);
          shadow1Ref().position([shadow1X, shadow1Y]);
          
          // Animate second shadow from [-10, -10] back to [10, 10]
          const shadow2X = -10 + (20 * t);
          const shadow2Y = -10 + (20 * t);
          shadow2Ref().position([shadow2X, shadow2Y]);
          
          // Swap colors halfway through
          if (t >= 0.5) {
            shadow1Ref().fill("#ff005e");
            shadow2Ref().fill("#00d4ff");
          } else {
            shadow1Ref().fill("#00d4ff");
            shadow2Ref().fill("#ff005e");
          }
        }
      })
    )
  );
  
  // Keep the scene running to show the animation
  yield* waitFor(15);
});
