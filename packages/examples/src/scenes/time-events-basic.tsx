import {Circle, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  all,
  createRef,
  createSignal,
  loopUntil,
  sequence,
  useDuration,
  waitFor,
  waitUntil,
} from '@revideo/core';

export default makeScene2D('time-events-basic', function* (view) {
  const circle = createRef<Circle>();
  const rect = createRef<Rect>();
  const title = createRef<Txt>();
  const counter = createRef<Txt>();
  const loopCount = createSignal(0);

  view.add(
    <>
      <Txt
        ref={title}
        y={-300}
        fontSize={60}
        fill="#0f0e0eff"
        text="Time Events Demo"
        opacity={0}
      />
      <Txt
        ref={counter}
        y={-200}
        fontSize={40}
        fill="#666666"
        text={() => `Loops: ${loopCount()}`}
        opacity={0}
      />
      <Circle
        ref={circle}
        x={-250}
        y={0}
        width={120}
        height={120}
        fill="#e13238"
      />
      <Rect
        ref={rect}
        x={250}
        y={0}
        width={120}
        height={120}
        fill="#68ABDF"
        radius={10}
      />
    </>,
  );

  // Start with a small delay instead of waitUntil to ensure scene initializes
  yield* waitFor(0.5);

  // Wait until the 'start' time event
  // This creates a time marker on the timeline that you can adjust in the editor
  yield* waitUntil('start');

  // Animate the title with a duration defined by 'title-fade' time event
  yield* title().opacity(1, useDuration('title-fade'));

  // Wait until 'circle-animation' time event
  yield* waitUntil('circle-animation');

  // Animate the circle - the duration is adjustable via 'circle-move' time event
  yield* circle().position.x(250, useDuration('circle-move'));

  // Wait until 'rect-animation' time event
  yield* waitUntil('rect-animation');

  // Animate the rectangle color - first change to yellow, then to red
  yield* rect().fill('#e6a700', useDuration('rect-color-yellow'));
  yield* rect().fill('#e13238', useDuration('rect-color-red'));

  // Loop animation demonstration
  yield* waitUntil('start-loop');
  yield* counter().opacity(1, 0.3);

  // Loop both shapes until 'stop-loop' time event
  yield* loopUntil('stop-loop', function* () {
    loopCount(loopCount() + 1);
    yield* all(
      circle().rotation(circle().rotation() + 360, 0.5),
      rect().rotation(rect().rotation() - 360, 0.5),
    );
  });

  // Synchronized finale animation
  yield* waitUntil('final');
  
  yield* all(
    counter().opacity(0, 0.3),
    sequence(
      0.1,
      circle().scale(1.5, 0.4).to(1, 0.4),
      rect().scale(1.5, 0.4).to(1, 0.4),
    ),
  );
});
