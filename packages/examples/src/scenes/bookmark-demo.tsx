import {Circle, Layout, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  all,
  bookmark,
  createRef,
  easeInOutCubic,
  tween,
  waitFor,
} from '@revideo/core';

/**
 * Bookmark Demo Scene
 * 
 * This demo shows how to use the bookmark() function to create visual markers
 * on the timeline. Bookmarks help you navigate and organize your animation.
 * 
 * Features:
 * - Add bookmarks at any point in your animation
 * - Customize bookmark colors
 * - Click bookmarks in the timeline to jump to that moment
 * - Double-click to navigate to the bookmark code
 */
export default makeScene2D('bookmark-demo', function* (view) {
  const title = createRef<Txt>();
  const subtitle = createRef<Txt>();
  const circle1 = createRef<Circle>();
  const circle2 = createRef<Circle>();
  const circle3 = createRef<Circle>();

  view.add(
    <Layout
      width={'100%'}
      height={'100%'}
      alignItems={'center'}
      justifyContent={'center'}
      layout
      direction={'column'}
      gap={40}
    >
      <Txt
        ref={title}
        fontSize={80}
        fontWeight={700}
        fill="#ffffff"
        text="Bookmark Demo"
        opacity={0}
      />
      <Txt
        ref={subtitle}
        fontSize={40}
        fill="#888888"
        text="Using bookmark() function"
        opacity={0}
      />
      <Layout gap={80}>
        <Circle ref={circle1} size={120} fill="#e13238" opacity={0} />
        <Circle ref={circle2} size={120} fill="#68ABDF" opacity={0} />
        <Circle ref={circle3} size={120} fill="#4CAF50" opacity={0} />
      </Layout>
    </Layout>,
  );

  // BOOKMARK: Mark the intro section with orange color
  bookmark('intro', '#FFA726');

  yield* all(title().opacity(1, 0.8), subtitle().opacity(1, 0.8));

  yield* waitFor(0.5);

  // BOOKMARK: Mark when circles appear with green color
  bookmark('show-circles', '#4CAF50');

  yield* all(
    circle1().opacity(1, 0.5),
    circle2().opacity(1, 0.5),
    circle3().opacity(1, 0.5),
  );

  yield* waitFor(0.3);

  // BOOKMARK: Mark the wave animation with blue color
  bookmark('wave-animation', '#68ABDF');

  yield* all(
    tween(1.5, value => {
      const progress = easeInOutCubic(value);
      circle1().position.y(-100 * Math.sin(progress * Math.PI * 2));
    }),
    tween(1.5, value => {
      const progress = easeInOutCubic(value);
      circle2().position.y(
        -100 * Math.sin(progress * Math.PI * 2 + Math.PI / 2),
      );
    }),
    tween(1.5, value => {
      const progress = easeInOutCubic(value);
      circle3().position.y(-100 * Math.sin(progress * Math.PI * 2 + Math.PI));
    }),
  );

  yield* waitFor(0.3);

  // BOOKMARK: Mark rotation with purple color
  bookmark('rotate', '#9C27B0');

  yield* all(
    circle1().rotation(360, 1),
    circle2().rotation(-360, 1),
    circle3().rotation(360, 1),
  );

  yield* waitFor(0.3);

  // BOOKMARK: Test long bookmark name - this will be truncated with ellipsis
  bookmark('this-is-a-very-long-bookmark-name-to-test-text-truncation-feature', '#FF5722');

  yield* all(
    circle1().scale(1.5, 0.5),
    circle2().scale(1.5, 0.5),
    circle3().scale(1.5, 0.5),
  );

  bookmark('book-test')
  
  yield* all(
    circle1().scale(1, 0.5),
    circle2().scale(1, 0.5),
    circle3().scale(1, 0.5),
  );

  yield* waitFor(0.3);

  // BOOKMARK: Mark scale animation with pink color
  bookmark('scale', '#E91E63');

  yield* all(
    circle1().position.y(0, 0.5),
    circle2().position.y(0, 0.5),
    circle3().position.y(0, 0.5),
  );

  yield* waitFor(0.3);

  // BOOKMARK: Mark the finale with red color
  bookmark('finale', '#e13238');

  yield* all(
    title().opacity(0, 1),
    subtitle().opacity(0, 1),
    circle1().opacity(0, 1),
    circle2().opacity(0, 1),
    circle3().opacity(0, 1),
  );

  yield* waitFor(1);
});
