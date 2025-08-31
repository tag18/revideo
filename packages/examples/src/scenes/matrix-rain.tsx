import {makeScene2D, Txt, Rect} from '@revideo/2d';
import {createRef, tween, waitFor, all, loop, linear, Vector2} from '@revideo/core';

export default makeScene2D('matrix-rain', function* (view) {
  // Create references for components
  const mainTextRef = createRef<Txt>();
  const glitchTextRef = createRef<Txt>();
  const rainRef1 = createRef<Rect>();
  const rainRef2 = createRef<Rect>();
  const rainRef3 = createRef<Rect>();
  
  // Background setup - black screen
  view.fill('#000000');
  
  // Create simple rain effect with 3 strips
  view.add(
    <Rect
      ref={rainRef1}
      width={view.width()}
      height={20}
      x={0}
      y={-view.height()}
      fill="#00ff0033"
      zIndex={1}
    />
  );
  
  view.add(
    <Rect
      ref={rainRef2}
      width={view.width()}
      height={20}
      x={0}
      y={-view.height() - 200}
      fill="#00ff0019"
      zIndex={1}
    />
  );
  
  view.add(
    <Rect
      ref={rainRef3}
      width={view.width()}
      height={20}
      x={0}
      y={-view.height() - 400}
      fill="#00ff0026"
      zIndex={1}
    />
  );
  
  // Main MATRIX text
  view.add(
    <Txt
      ref={mainTextRef}
      text="MATRIX"
      fontSize={80}
      fontFamily="monospace"
      fill="#00ff00"
      shadowColor="#00ff00"
      shadowBlur={30}
      zIndex={3}
    />
  );
  
  // Glitch overlay text
  view.add(
    <Txt
      ref={glitchTextRef}
      text="MATRIX"
      fontSize={80}
      fontFamily="monospace"
      fill="#00ff00"
      shadowColor="#00ff00"
      shadowBlur={15}
      zIndex={4}
      opacity={0}
    />
  );
  
  // Start animations
  yield* all(
    // Rain animation - continuous falling effect
    loop(Infinity, function* () {
      yield* all(
        tween(10, value => {
          rainRef1().y(-view.height() + value * (view.height() * 2 + 100));
        }, linear),
        tween(10, value => {
          rainRef2().y(-view.height() - 200 + value * (view.height() * 2 + 100));
        }, linear),
        tween(10, value => {
          rainRef3().y(-view.height() - 400 + value * (view.height() * 2 + 100));
        }, linear)
      );
    }),
    
    // Main text glow pulsing
    loop(Infinity, function* () {
      yield* tween(3, value => {
        const intensity = Math.sin(value * Math.PI * 2) * 0.3 + 0.7;
        mainTextRef().shadowBlur(30 * intensity);
      });
    }),
    
    // Simple glitch effect every 2 seconds
    loop(Infinity, function* () {
      // Normal state
      glitchTextRef().opacity(0);
      yield* waitFor(1.5);
      
      // Quick glitch flash
      glitchTextRef().opacity(0.8);
      glitchTextRef().position(new Vector2(-3, -3));
      yield* waitFor(0.1);
      
      glitchTextRef().position(new Vector2(3, 3));
      yield* waitFor(0.1);
      
      glitchTextRef().position(Vector2.zero);
      glitchTextRef().opacity(0);
      yield* waitFor(0.3);
    })
  );
});
