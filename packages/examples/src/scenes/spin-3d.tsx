import {makeScene2D, Txt, Layout} from '@revideo/2d';
import {createRef, tween, loop, Vector2, waitFor} from '@revideo/core';

export default makeScene2D('spin-3d', function* (view) {
  const mainTextRef = createRef<Txt>();
  const shadow1Ref = createRef<Txt>();
  const shadow2Ref = createRef<Txt>();
  const shadow3Ref = createRef<Txt>();
  const shadow4Ref = createRef<Txt>();
  const shadow5Ref = createRef<Txt>();
  
  // Background setup - linear gradient from #222 to #000 (135deg)
  view.fill('#191919');
  
  // Add multi-layer text shadows using Layout for proper centering
  view.add(
    <Layout
      width={'100%'}
      height={'100%'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      {/* Shadow layer 5 (furthest back) */}
      <Txt
        ref={shadow5Ref}
        text="3D SPIN"
        fontSize={320} // 5rem equivalent
        fontFamily="Arial"
        fontWeight={700}
        fill="#457b9d"
        position={[5, 5]}
        zIndex={1}
      />
      
      {/* Shadow layer 4 */}
      <Txt
        ref={shadow4Ref}
        text="3D SPIN"
        fontSize={320}
        fontFamily="Arial"
        fontWeight={700}
        fill="#a8dadc"
        position={[4, 4]}
        zIndex={2}
      />
      
      {/* Shadow layer 3 */}
      <Txt
        ref={shadow3Ref}
        text="3D SPIN"
        fontSize={320}
        fontFamily="Arial"
        fontWeight={700}
        fill="#fcbf49"
        position={[3, 3]}
        zIndex={3}
      />
      
      {/* Shadow layer 2 */}
      <Txt
        ref={shadow2Ref}
        text="3D SPIN"
        fontSize={320}
        fontFamily="Arial"
        fontWeight={700}
        fill="#f77f00"
        position={[2, 2]}
        zIndex={4}
      />
      
      {/* Shadow layer 1 */}
      <Txt
        ref={shadow1Ref}
        text="3D SPIN"
        fontSize={320}
        fontFamily="Arial"
        fontWeight={700}
        fill="#e63946"
        position={[1, 1]}
        zIndex={5}
      />
      
      {/* Main text (on top) */}
      <Txt
        ref={mainTextRef}
        text="3D SPIN"
        fontSize={320}
        fontFamily="Arial"
        fontWeight={700}
        fill="#ffffff"
        zIndex={6}
      />
    </Layout>
  );

  // Start the infinite rotation animation
  yield loop(Infinity, function* () {
    yield* tween(4, value => {
      const angle = value * 360; // Full rotation in 4 seconds
      const rotation = Math.cos(angle * Math.PI / 180);
      
      // Apply perspective effect using scale transformation
      // Y-axis rotation simulation through horizontal scaling
      mainTextRef().scale(new Vector2(Math.abs(rotation), 1));
      shadow1Ref().scale(new Vector2(Math.abs(rotation), 1));
      shadow2Ref().scale(new Vector2(Math.abs(rotation), 1));
      shadow3Ref().scale(new Vector2(Math.abs(rotation), 1));
      shadow4Ref().scale(new Vector2(Math.abs(rotation), 1));
      shadow5Ref().scale(new Vector2(Math.abs(rotation), 1));
      
      // Slightly skew for more 3D effect when at edges
      const skewAmount = rotation * 0.3;
      mainTextRef().skew(new Vector2(skewAmount, 0));
      shadow1Ref().skew(new Vector2(skewAmount, 0));
      shadow2Ref().skew(new Vector2(skewAmount, 0));
      shadow3Ref().skew(new Vector2(skewAmount, 0));
      shadow4Ref().skew(new Vector2(skewAmount, 0));
      shadow5Ref().skew(new Vector2(skewAmount, 0));
    });
  });
  
  // Keep the scene running to show the animation
  yield* waitFor(15);
});