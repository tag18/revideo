import {Txt, makeScene2D, Layout, Circle} from '@revideo/2d';
import {createRef, tween, easeOutCubic, loop, waitFor, all} from '@revideo/core';

export default makeScene2D('explosive-text', function* (view) {
  const explosiveText = createRef<Txt>();
  const burst1 = createRef<Circle>();
  const burst2 = createRef<Circle>();

  // Set background color to match the HTML example
  view.fill('#1a1a1a');

  view.add(
    <Layout
      width={'100%'}
      height={'100%'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      {/* Burst effects - positioned behind the text */}
      {/* First burst (pink) */}
      <Circle
        ref={burst1}
        size={0}
        fill="rgba(255, 0, 150, 0.6)"
        zIndex={1}
        opacity={0}
      />
      
      {/* Second burst (blue) */}
      <Circle
        ref={burst2}
        size={0}
        fill="rgba(0, 200, 255, 0.6)"
        zIndex={2}
        opacity={0}
      />
      
      {/* Main text */}
      <Txt
        ref={explosiveText}
        text="Hello world"
        fontSize={192}
        fill="#fff"
        fontFamily="Arial, sans-serif"
        letterSpacing={19.2} // 0.1em of 192px
        fontWeight={400}
        zIndex={3}
      />
    </Layout>
  );

  // Create the explosive animation sequence
  yield loop(Infinity, function*() {
    // Explosive animation with synchronized text scaling and bursts
    yield* all(
      // Text scale animation - gradual scale up then back down
      tween(0.8, value => {
        const progress = easeOutCubic(value);
        let scale = 1;
        
        if (progress <= 0.3) {
          // Scale up phase (0 to 0.3): 1.0 to 1.1
          scale = 1 + (progress / 0.3) * 0.1;
        } else if (progress <= 0.6) {
          // Hold at max scale (0.3 to 0.6): stay at 1.1
          scale = 1.1;
        } else {
          // Scale down phase (0.6 to 1.0): 1.1 back to 1.0
          scale = 1.1 - ((progress - 0.6) / 0.4) * 0.1;
        }
        
        explosiveText().scale(scale);
      }),
      
      // First burst animation (pink) - synchronized with text
      tween(0.8, value => {
        const progress = easeOutCubic(value);
        
        // Size animation: starts when text begins scaling
        const maxSize = 400;
        let currentSize = 0;
        
        if (progress >= 0.1) { // Start burst slightly after text starts scaling
          const burstProgress = (progress - 0.1) / 0.9; // 0 to 1
          currentSize = maxSize * 1.5 * burstProgress;
        }
        
        burst1().size(currentSize);
        
        // Opacity animation: synchronized with burst size
        let opacity = 0;
        if (progress >= 0.1 && progress <= 0.2) {
          opacity = (progress - 0.1) * 10; // Quick fade in
        } else if (progress <= 0.7) {
          opacity = 1 - (progress - 0.2) * 0.2 / 0.5; // Slow fade to 0.8
        } else {
          opacity = 0.8 - (progress - 0.7) * 0.8 / 0.3; // Fade out
        }
        
        burst1().opacity(Math.max(0, opacity));
      }),
      
      // Second burst animation (blue) - slightly delayed for depth
      tween(0.8, value => {
        const progress = easeOutCubic(value);
        
        // Size animation: starts slightly later than first burst
        const maxSize = 400;
        let currentSize = 0;
        
        if (progress >= 0.15) { // Start later than first burst
          const burstProgress = (progress - 0.15) / 0.85;
          currentSize = maxSize * 1.3 * burstProgress; // Slightly smaller
        }
        
        burst2().size(currentSize);
        
        // Opacity animation: similar to first burst but delayed
        let opacity = 0;
        if (progress >= 0.15 && progress <= 0.25) {
          opacity = (progress - 0.15) * 10; // Quick fade in
        } else if (progress <= 0.75) {
          opacity = 1 - (progress - 0.25) * 0.2 / 0.5; // Slow fade to 0.8
        } else {
          opacity = 0.8 - (progress - 0.75) * 0.8 / 0.25; // Fade out
        }
        
        burst2().opacity(Math.max(0, opacity));
      })
    );
    
    // Reset everything for next iteration
    explosiveText().scale(1);
    burst1().size(0).opacity(0);
    burst2().size(0).opacity(0);
    
    // Wait before next burst
    yield* waitFor(2);
  });
  
  // Keep the scene running to show the animation
  yield* waitFor(15);
});
