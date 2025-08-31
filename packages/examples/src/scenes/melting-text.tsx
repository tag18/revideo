import {Txt, makeScene2D, Layout} from '@revideo/2d';
import {createRef, tween, easeInOutCubic, loop, waitFor, all, Color} from '@revideo/core';

export default makeScene2D('melting-text', function* (view) {
  const mainText = createRef<Txt>();
  const dripText1 = createRef<Txt>();
  const dripText2 = createRef<Txt>();

  // Set background color to match the HTML example
  view.fill('#1a1a1a');

  view.add(
    <Layout
      width={'100%'}
      height={'100%'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      {/* Drip effect layer 2 (most blurred, bottom layer) */}
      <Txt
        ref={dripText2}
        text="MELTING"
        fontSize={384} // 6rem = 384px
        fontWeight={700}
        fontFamily="Arial, sans-serif"
        fill={() => {
          // Create gradient effect
          return Color.lerp(
            new Color('#ff6f61'),
            new Color('#ffbd44'),
            0.5
          );
        }}
        zIndex={1}
        opacity={0.3}
        shadowBlur={10}
        shadowColor="rgba(255, 111, 97, 0.5)"
      />
      
      {/* Drip effect layer 1 (middle layer) */}
      <Txt
        ref={dripText1}
        text="MELTING"
        fontSize={384}
        fontWeight={700}
        fontFamily="Arial, sans-serif"
        fill={() => {
          // Create gradient effect
          return Color.lerp(
            new Color('#ff6f61'),
            new Color('#ffbd44'),
            0.3
          );
        }}
        zIndex={2}
        opacity={0.5}
      />
      
      {/* Main text (top layer) */}
      <Txt
        ref={mainText}
        text="MELTING"
        fontSize={384}
        fontWeight={700}
        fontFamily="Arial, sans-serif"
        fill={() => {
          // Create gradient effect
          return Color.lerp(
            new Color('#ff6f61'),
            new Color('#ffbd44'),
            0.4
          );
        }}
        zIndex={3}
      />
    </Layout>
  );

  // Create the melting animation loop
  yield loop(Infinity, function*() {
    yield* all(
      // Main text melting animation (up and down movement)
      tween(3, value => {
        const progress = easeInOutCubic(value);
        
        // Y movement: 0 -> 20px -> 0
        let yOffset = 0;
        if (progress <= 0.5) {
          yOffset = (progress * 2) * 20; // 0 to 20px
        } else {
          yOffset = 20 - ((progress - 0.5) * 2) * 20; // 20px to 0
        }
        
        mainText().position([0, yOffset]);
      }),
      
      // First drip layer animation (vertical stretching)
      tween(3, value => {
        const progress = easeInOutCubic(value);
        
        // Scale Y: 1 -> 1.5 -> 1
        let scaleY = 1;
        if (progress <= 0.5) {
          scaleY = 1 + (progress * 2) * 0.5; // 1 to 1.5
        } else {
          scaleY = 1.5 - ((progress - 0.5) * 2) * 0.5; // 1.5 to 1
        }
        
        // Opacity: 0.5 -> 0.7 -> 0.5
        let opacity = 0.5;
        if (progress <= 0.5) {
          opacity = 0.5 + (progress * 2) * 0.2; // 0.5 to 0.7
        } else {
          opacity = 0.7 - ((progress - 0.5) * 2) * 0.2; // 0.7 to 0.5
        }
        
        dripText1().scale([1, scaleY]).opacity(opacity);
      }),
      
      // Second drip layer animation (more subtle stretching)
      tween(3, value => {
        const progress = easeInOutCubic(value);
        
        // Scale Y: 1 -> 1.3 -> 1 (less stretching than first layer)
        let scaleY = 1;
        if (progress <= 0.5) {
          scaleY = 1 + (progress * 2) * 0.3; // 1 to 1.3
        } else {
          scaleY = 1.3 - ((progress - 0.5) * 2) * 0.3; // 1.3 to 1
        }
        
        // Opacity: 0.3 -> 0.5 -> 0.3
        let opacity = 0.3;
        if (progress <= 0.5) {
          opacity = 0.3 + (progress * 2) * 0.2; // 0.3 to 0.5
        } else {
          opacity = 0.5 - ((progress - 0.5) * 2) * 0.2; // 0.5 to 0.3
        }
        
        dripText2().scale([1, scaleY]).opacity(opacity);
      })
    );
  });
  
  // Keep the scene running to show the animation
  yield* waitFor(15);
});
