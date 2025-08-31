import {makeScene2D, Txt, Layout, Rect, Node} from '@revideo/2d';
import {createRef, tween, waitFor, loop, all, linear, easeInOutCubic, easeInOutSine, Color} from '@revideo/core';

export default makeScene2D('aurora-text', function* (view) {
  // Component references
  const backgroundRef = createRef<Rect>();
  const titleRef = createRef<Txt>();
  const subtitleRef = createRef<Txt>();
  const auroraContainerRef = createRef<Layout>();
  const aurora1Ref = createRef<Rect>();
  const aurora2Ref = createRef<Rect>();
  const aurora3Ref = createRef<Rect>();
  const aurora4Ref = createRef<Rect>();
  
  // Aurora colors from CSS variables
  const auroraColors = {
    clr1: '#00c2ff', // Blue
    clr2: '#33ff8c', // Green  
    clr3: '#ffc640', // Yellow
    clr4: '#e54cff', // Purple
  };
  
  // Set up the main layout with dark background
  view.add(
    <Layout
      width={'100%'}
      height={'100%'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      {/* Black background */}
      <Rect
        ref={backgroundRef}
        width={'100%'}
        height={'100%'}
        fill="#000000"
        zIndex={-1}
      />
      
      {/* Main content container */}
      <Layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={40}
      >
        {/* Title with aurora gradient effect */}
        <Node cache zIndex={3}>
          {/* Text mask that defines the visible area */}
          <Txt
            ref={titleRef}
            text="the beautiful aurora"
            fontSize={120}
            fontFamily="Inter"
            fontWeight={800}
            fill="#ffffff"
            letterSpacing={-2}
          />
          
          {/* Aurora background layers that will be visible through the text mask */}
          <Layout
            ref={auroraContainerRef}
            width={800}
            height={200}
            position={[0, 0]}
            compositeOperation={'source-in'}
          >
            {/* Enhanced default fallback background - covers entire text area */}
            <Rect
              width={900}
              height={250}
              fill={auroraColors.clr1}
              position={[0, 0]}
              opacity={0.6}
            />
            <Rect
              width={900}
              height={250}
              fill={auroraColors.clr2}
              position={[0, 0]}
              opacity={0.5}
            />
            <Rect
              width={900}
              height={250}
              fill={auroraColors.clr3}
              position={[0, 0]}
              opacity={0.5}
            />
            <Rect
              width={900}
              height={250}
              fill={auroraColors.clr4}
              position={[0, 0]}
              opacity={0.6}
            />
            
            {/* Extended static gradient base - covers more area including left and right edges */}
            <Rect
              width={250}
              height={250}
              fill={auroraColors.clr1}
              position={[-350, 0]}
              opacity={0.8}
            />
            <Rect
              width={250}
              height={250}
              fill={auroraColors.clr2}
              position={[-150, 0]}
              opacity={0.8}
            />
            <Rect
              width={250}
              height={250}
              fill={auroraColors.clr3}
              position={[50, 0]}
              opacity={0.8}
            />
            <Rect
              width={250}
              height={250}
              fill={auroraColors.clr4}
              position={[250, 0]}
              opacity={0.8}
            />
            
            {/* Additional left edge coverage for "t" letter - enhanced opacity */}
            <Rect
              width={200}
              height={250}
              fill={auroraColors.clr1}
              position={[-450, 0]}
              opacity={0.8}
            />
            <Rect
              width={200}
              height={250}
              fill={auroraColors.clr2}
              position={[-500, 0]}
              opacity={0.7}
            />
            
            {/* Additional right edge coverage for "ra" letters */}
            <Rect
              width={200}
              height={250}
              fill={auroraColors.clr4}
              position={[400, 0]}
              opacity={0.8}
            />
            <Rect
              width={200}
              height={250}
              fill={auroraColors.clr1}
              position={[450, 0]}
              opacity={0.7}
            />
            
            {/* Moving aurora elements for dynamic color changes */}
            <Rect
              ref={aurora1Ref}
              width={400}
              height={400}
              fill={auroraColors.clr1}
              position={[0, -300]}
              shadowBlur={60}
              shadowColor={auroraColors.clr1}
              opacity={0.5}
              radius={[150, 100, 80, 80]}
            />
            
            <Rect
              ref={aurora2Ref}
              width={400}
              height={400}
              fill={auroraColors.clr3}
              position={[400, 0]}
              shadowBlur={60}
              shadowColor={auroraColors.clr3}
              opacity={0.5}
              radius={[150, 100, 80, 80]}
            />
            
            <Rect
              ref={aurora3Ref}
              width={400}
              height={400}
              fill={auroraColors.clr2}
              position={[-400, 100]}
              shadowBlur={60}
              shadowColor={auroraColors.clr2}
              opacity={0.5}
              radius={[150, 100, 80, 80]}
            />
            
            <Rect
              ref={aurora4Ref}
              width={400}
              height={400}
              fill={auroraColors.clr4}
              position={[400, 300]}
              shadowBlur={60}
              shadowColor={auroraColors.clr4}
              opacity={0.5}
              radius={[150, 100, 80, 80]}
            />
          </Layout>
        </Node>
        
        {/* Subtitle */}
        <Txt
          ref={subtitleRef}
          text="Made with love and only the CSS."
          fontSize={24}
          fontFamily="Inter"
          fontWeight={400}
          fill="#ffffff"
          opacity={0.8}
          zIndex={1}
        />
      </Layout>
    </Layout>
  );

  // Aurora movement animation 1 (12s cycle)
  function* animateAurora1() {
    yield* tween(12, value => {
      const progress = easeInOutCubic(value);
      if (progress <= 0.5) {
        // 0-50%: top-right to bottom-left
        const t = progress * 2;
        aurora1Ref().position([
          linear(t, 0, -300),
          linear(t, -300, 200)
        ]);
      } else if (progress <= 0.75) {
        // 50-75%: bottom-left to bottom-right
        const t = (progress - 0.5) * 4;
        aurora1Ref().position([
          linear(t, -300, 100),
          200
        ]);
      } else {
        // 75-100%: bottom-right back to top-right
        const t = (progress - 0.75) * 4;
        aurora1Ref().position([
          linear(t, 100, 0),
          linear(t, 200, -300)
        ]);
      }
    });
  }

  // Aurora movement animation 2 (12s cycle, different timing)
  function* animateAurora2() {
    yield* tween(12, value => {
      const progress = easeInOutCubic(value);
      if (progress <= 0.6) {
        // 0-60%: top-left to bottom-right
        const t = progress / 0.6;
        aurora2Ref().position([
          linear(t, 0, 300),
          linear(t, -200, 200)
        ]);
      } else if (progress <= 0.85) {
        // 60-85%: bottom-right to bottom-left
        const t = (progress - 0.6) / 0.25;
        aurora2Ref().position([
          linear(t, 300, -100),
          200
        ]);
      } else {
        // 85-100%: bottom-left back to top-left
        const t = (progress - 0.85) / 0.15;
        aurora2Ref().position([
          linear(t, -100, 0),
          linear(t, 200, -200)
        ]);
      }
    });
  }

  // Aurora movement animation 3 (8s cycle)
  function* animateAurora3() {
    yield* tween(8, value => {
      const progress = easeInOutCubic(value);
      if (progress <= 0.4) {
        // 0-40%: bottom-left to top-right
        const t = progress / 0.4;
        aurora3Ref().position([
          linear(t, -400, 300),
          linear(t, 100, -200)
        ]);
      } else if (progress <= 0.65) {
        // 40-65%: top-right to center
        const t = (progress - 0.4) / 0.25;
        aurora3Ref().position([
          linear(t, 300, 0),
          linear(t, -200, -60)
        ]);
      } else {
        // 65-100%: center back to bottom-left
        const t = (progress - 0.65) / 0.35;
        aurora3Ref().position([
          linear(t, 0, -400),
          linear(t, -60, 100)
        ]);
      }
    });
  }

  // Aurora movement animation 4 (24s cycle - longest)
  function* animateAurora4() {
    yield* tween(24, value => {
      const progress = easeInOutCubic(value);
      if (progress <= 0.5) {
        // 0-50%: bottom-right to center
        const t = progress * 2;
        aurora4Ref().position([
          linear(t, 400, 160),
          linear(t, 300, 0)
        ]);
      } else if (progress <= 0.9) {
        // 50-90%: center to top-right
        const t = (progress - 0.5) / 0.4;
        aurora4Ref().position([
          linear(t, 160, 100),
          linear(t, 0, -100)
        ]);
      } else {
        // 90-100%: top-right back to bottom-right
        const t = (progress - 0.9) / 0.1;
        aurora4Ref().position([
          linear(t, 100, 400),
          linear(t, -100, 300)
        ]);
      }
    });
  }

  // Morphing animation for all aurora elements (6s cycle)
  function* animateAuroraMorph() {
    yield* tween(6, value => {
      const progress = easeInOutSine(value);
      // Create morphing effect by changing size and blur
      const baseSizeVariation = 50 * Math.sin(progress * Math.PI * 2);
      const baseBlurVariation = 20 * Math.sin(progress * Math.PI * 4);
      
      aurora1Ref().size(600 + baseSizeVariation);
      aurora2Ref().size(600 + baseSizeVariation * 0.8);
      aurora3Ref().size(600 + baseSizeVariation * 1.2);
      aurora4Ref().size(600 + baseSizeVariation * 0.9);
      
      // Simulate blur variation with shadow
      aurora1Ref().shadowBlur(50 + baseBlurVariation);
      aurora2Ref().shadowBlur(50 + baseBlurVariation * 0.7);
      aurora3Ref().shadowBlur(50 + baseBlurVariation * 1.1);
      aurora4Ref().shadowBlur(50 + baseBlurVariation * 0.9);
    });
  }

  // Start all animations in parallel, looping infinitely
  yield loop(Infinity, function* () {
    yield* all(
      animateAurora1(),
      animateAurora2(), 
      animateAurora3(),
      animateAurora4(),
      animateAuroraMorph()
    );
  });
  
  // Keep scene running to show animations in timeline
  yield* waitFor(30);
});
