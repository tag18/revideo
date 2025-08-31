import {makeScene2D, Txt, Layout, Rect, Line} from '@revideo/2d';
import {createRef, tween, waitFor, loop, all, linear, easeOutCubic} from '@revideo/core';

export default makeScene2D('strong-text', function* (view) {
  // Component references for animation elements
  const backgroundRef = createRef<Rect>();
  const topStrongRef = createRef<Txt>();
  const bottomStrongRef = createRef<Txt>();
  const lineRef = createRef<Line>();
  
  // Set up the main layout with pink background
  view.add(
    <Layout
      width={'100%'}
      height={'100%'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      {/* Background rectangle matching CSS */}
      <Rect
        ref={backgroundRef}
        width={'100%'}
        height={'100%'}
        fill="#fda9a9"
        zIndex={-1}
      />
      
      {/* Main container - fixed display area for the complete STRONG text */}
      <Layout
        width={400}
        height={100}
        alignItems={'center'}
        justifyContent={'center'}
        position={[0, 0]}
        clip={true}
      >
        {/* Top STRONG text - shows only upper half, slides up from center */}
        <Txt
          ref={topStrongRef}
          text="STRONG"
          fontSize={96}
          fontFamily="Arial"
          fill="#ffffff"
          position={[0, 50]}
          opacity={0}
          zIndex={2}
        />
        
        {/* Bottom STRONG text - shows only lower half, slides down from center */}
        <Txt
          ref={bottomStrongRef}
          text="STRONG"
          fontSize={96}
          fontFamily="Arial"
          fill="#ffffff"
          position={[0, -50]}
          opacity={0}
          zIndex={2}
        />
        
        {/* White line that slides across */}
        <Line
          ref={lineRef}
          points={[[-200, 0], [200, 0]]}
          stroke="#ffffff"
          lineWidth={8}
          position={[-800, 0]}
          zIndex={3}
        />
      </Layout>
    </Layout>
  );

  // Animation function for the reveal effect
  function* animateReveal() {
    // Phase 1: Slide the white line across (0.5s)
    yield* tween(0.5, value => {
      const progress = value;
      lineRef().position([linear(progress, -800, 800), 0]);
    });
    
    // Phase 2: Remove text shadow immediately after line passes (no longer needed)
    yield* waitFor(0.01);
    
    // Phase 3: Reveal text with split effect (0.3s delay + 0.3s animation with ease-out)
    yield* waitFor(0.3);
    
    yield* all(
      // Top STRONG slides up from center, revealing upper half
      tween(0.3, value => {
        const progress = easeOutCubic(value);
        topStrongRef().opacity(progress);
        // Slides up from center (y=50) to final position (y=0)
        topStrongRef().position([0, linear(progress, 50, 0)]);
      }),
      
      // Bottom STRONG slides down from center, revealing lower half
      tween(0.3, value => {
        const progress = easeOutCubic(value);
        bottomStrongRef().opacity(progress);
        // Slides down from center (y=-50) to final position (y=0)
        bottomStrongRef().position([0, linear(progress, -50, 0)]);
      })
    );
    
    // Phase 4: Hold the revealed state for 2 seconds
    yield* waitFor(2);
    
    // Phase 5: Reset animation with ease-out (reverse the process)
    yield* all(
      // Top STRONG slides back to center (hide upper half)
      tween(0.3, value => {
        const progress = easeOutCubic(1 - value);
        topStrongRef().opacity(progress);
        topStrongRef().position([0, linear(progress, 0, 50)]);
      }),
      
      // Bottom STRONG slides back to center (hide lower half)
      tween(0.3, value => {
        const progress = easeOutCubic(1 - value);
        bottomStrongRef().opacity(progress);
        bottomStrongRef().position([0, linear(progress, 0, -50)]);
      })
    );
    
    yield* waitFor(0.3);
    
    // Restore text (no longer needed)
    yield* waitFor(0.01);
    
    // Reset line position
    yield* tween(0.5, value => {
      const progress = value;
      lineRef().position([linear(progress, 800, -800), 0]);
    });
    
    // Wait before next loop
    yield* waitFor(1);
  }

  // Start the infinite animation loop
  yield loop(Infinity, function* () {
    yield* animateReveal();
  });
  
  // Keep scene running to show animations in timeline
  yield* waitFor(15);
});
