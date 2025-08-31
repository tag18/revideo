import {Txt, makeScene2D, Layout} from '@revideo/2d';
import {createRef, tween, easeInOutCubic, loop, waitFor, createSignal, Color} from '@revideo/core';

export default makeScene2D('masked-animation', function* (view) {
  const maskedText = createRef<Txt>();
  const animationProgress = createSignal(0);

  // Set background color to match the HTML example
  view.fill('#222');

  view.add(
    <Layout
      width={'100%'}
      height={'100%'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      <Txt
        ref={maskedText}
        text="Masked Animation"
        fontSize={400}
        fontWeight={700}
        fontFamily="Arial, sans-serif"
        fill={() => {
          const progress = animationProgress();
          // Create a more realistic animated background effect
          // Simulate the moving background image with changing colors
          const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', 
            '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
          ];
          
          const numColors = colors.length;
          const colorIndex = Math.floor(progress * numColors) % numColors;
          const nextColorIndex = (colorIndex + 1) % numColors;
          const localProgress = (progress * numColors) % 1;
          
          // Interpolate between current and next color
          const currentColor = new Color(colors[colorIndex]);
          const nextColor = new Color(colors[nextColorIndex]);
          
          return Color.lerp(currentColor, nextColor, localProgress);
        }}
      />
    </Layout>
  );

  // Create the background animation loop with alternating direction
  yield loop(Infinity, () => 
    tween(5, value => {
      // Use linear interpolation for steady movement, then reverse
      const progress = value;
      animationProgress(progress);
    })
  );
  
  // Keep the scene running to show the animation
  yield* waitFor(15);
});
