# Revideo Coding Standards

## Language Requirements

### MANDATORY: English Only Policy
All code, comments, documentation, and naming must use English exclusively.

#### Comments
```tsx
// ✅ CORRECT: English comments explaining purpose and logic
const rotationSpeed = 2; // Rotation speed in revolutions per second
const textElement = createRef<Txt>();

// Start continuous rotation animation with smooth easing
yield* loop(Infinity, function* () {
  yield* tween(4, value => {
    const angle = value * 360; // Convert progress to full rotation
    textElement().rotation(angle);
  });
});

// ❌ WRONG: Non-English comments
const xuanzhuanSudu = 2; // 旋转速度
// 开始旋转动画
```

#### Variable and Function Names
```tsx
// ✅ CORRECT: Descriptive English names
const animationDuration = 3;
const fadeInEffect = createRef<Txt>();
const containerElement = createRef<Layout>();

function createSpinningText() { }
function animateMatrixRain() { }
function calculateRotationAngle(time: number) { }

// ❌ WRONG: Non-English or unclear names
const donghuaShijian = 3;
const danruXiaoguo = createRef<Txt>();
const rongqi = createRef<Layout>();

function chuangjianXuanzhuanWenben() { }
function donghuaJuzhenYu() { }
function a(t: number) { }
```

#### File Names
```tsx
// ✅ CORRECT: English words with kebab-case
spinning-text.tsx
matrix-rain.tsx
glowing-button.tsx
particle-explosion.tsx

// ❌ WRONG: Non-English or unclear names
xuanzhuan-wenben.tsx
juzhen-yu.tsx
btn.tsx
effect.tsx
```

## Naming Conventions

### Variables and Functions
- **Variables**: `camelCase` with descriptive English names
  ```tsx
  const animationDuration = 4;
  const primaryTextColor = '#ffffff';
  const rotationAngle = 45;
  ```

- **Functions**: `camelCase` with verb-noun patterns
  ```tsx
  function createTextElement() { }
  function animateRotation() { }
  function calculateBezierCurve() { }
  ```

- **Constants**: `UPPER_SNAKE_CASE` for module-level constants
  ```tsx
  const DEFAULT_ANIMATION_DURATION = 2;
  const PRIMARY_COLOR = '#ff0000';
  const MAX_ROTATION_SPEED = 360;
  ```

### Components and Types
- **Components**: `PascalCase` for React-style components
  ```tsx
  const SpinningText = createRef<Txt>();
  const MatrixRainContainer = createRef<Layout>();
  ```

- **Scene Names**: `kebab-case` for consistency
  ```tsx
  export default makeScene2D('spinning-text', function* (view) {
    // Scene implementation
  });
  ```

### Descriptive Naming Guidelines
```tsx
// ✅ GOOD: Names explain purpose and context
const fadeInDuration = 1.5;
const rotationSpeed = 180; // degrees per second
const textShadowOffset = [2, 2];
const primaryTextElement = createRef<Txt>();

// Start background color transition animation
yield* tween(fadeInDuration, value => {
  const opacity = easeInOutCubic(value);
  backgroundElement().opacity(opacity);
});

// ❌ BAD: Unclear or abbreviated names
const dur = 1.5;
const spd = 180;
const off = [2, 2];
const txt = createRef<Txt>();

// Do stuff
yield* tween(dur, v => {
  bg().opacity(v);
});
```

## Documentation Standards

### Function Documentation
```tsx
/**
 * Creates a spinning text animation with customizable speed and direction
 * @param text - The text content to display
 * @param duration - Animation duration in seconds
 * @param clockwise - Whether to rotate clockwise (true) or counterclockwise (false)
 */
function createSpinningTextAnimation(
  text: string, 
  duration: number, 
  clockwise: boolean = true
) {
  // Implementation details
}
```

### Scene Documentation
```tsx
/**
 * Matrix Rain Animation Scene
 * 
 * Recreates the iconic "digital rain" effect from The Matrix movie.
 * Features falling green characters with variable speeds and opacity effects.
 * 
 * Key techniques:
 * - Multiple Layout containers for parallax layers
 * - Staggered tween animations for character falling
 * - Dynamic opacity changes for fade effects
 */
export default makeScene2D('matrix-rain', function* (view) {
  // Scene implementation
});
```

### Inline Comments
```tsx
// Set up the main container with proper centering
view.add(
  <Layout
    width={'100%'}
    height={'100%'}
    alignItems={'center'}
    justifyContent={'center'}
  >
    {/* Primary text element with shadow effects */}
    <Txt
      ref={mainTextRef}
      text="SPINNING TEXT"
      fontSize={120}
      fill="#ffffff"
      fontWeight={700}
    />
  </Layout>
);

// Start infinite rotation animation
yield loop(Infinity, function* () {
  // Complete 360-degree rotation over 4 seconds
  yield* tween(4, value => {
    const rotationAngle = value * 360;
    mainTextRef().rotation(rotationAngle);
  });
});
```

## Code Quality Standards

### Self-Documenting Code
- Write code that explains itself through clear naming
- Use intermediate variables for complex calculations
- Break down complex animations into smaller, named functions

```tsx
// ✅ GOOD: Self-documenting with clear intermediate steps
const totalRotationDegrees = 360;
const animationDurationSeconds = 4;
const rotationSpeedDegreesPerSecond = totalRotationDegrees / animationDurationSeconds;

function animateTextRotation(element: Txt, duration: number) {
  return tween(duration, value => {
    const currentAngle = value * totalRotationDegrees;
    element.rotation(currentAngle);
  });
}

// ❌ BAD: Unclear purpose and magic numbers
function anim(e: Txt, d: number) {
  return tween(d, v => e.rotation(v * 360));
}
```

### Consistent Formatting
- Use consistent indentation (2 spaces)
- Group related imports
- Separate logical sections with blank lines
- Align similar code patterns

```tsx
import {makeScene2D, Txt, Layout, Circle} from '@revideo/2d';
import {createRef, tween, waitFor, loop, all} from '@revideo/core';
import {easeInOutCubic, linear} from '@revideo/core';

export default makeScene2D('example-scene', function* (view) {
  // Component references
  const mainText = createRef<Txt>();
  const backgroundCircle = createRef<Circle>();
  
  // Scene setup
  view.fill('#000000');
  
  // Component hierarchy
  view.add(
    <Layout width={'100%'} height={'100%'} alignItems={'center'} justifyContent={'center'}>
      <Circle ref={backgroundCircle} size={200} fill="#333333" />
      <Txt ref={mainText} text="Example" fontSize={48} fill="#ffffff" />
    </Layout>
  );
  
  // Animation sequence
  yield* all(
    animateBackgroundPulse(backgroundCircle),
    animateTextFade(mainText)
  );
  
  // Keep scene alive for timeline visibility
  yield* waitFor(10);
});
```

## Error Prevention

### Common Anti-Patterns to Avoid
```tsx
// ❌ WRONG: Non-descriptive variable names
const a = createRef<Txt>();
const b = 2;
const c = '#ff0000';

// ❌ WRONG: Magic numbers without explanation
yield* tween(3.14159, value => {
  element().rotation(value * 42);
});

// ❌ WRONG: No comments for complex logic
yield* all(
  tween(2, v => el1().x(v * 100 + Math.sin(v * Math.PI) * 50)),
  tween(3, v => el2().opacity(1 - v))
);

// ✅ CORRECT: Clear names and documented logic
const textElement = createRef<Txt>();
const bounceAnimationDuration = 2;
const fadeAnimationDuration = 3;

// Create bouncing motion with horizontal oscillation
yield* all(
  tween(bounceAnimationDuration, value => {
    const basePosition = value * 100; // Linear horizontal movement
    const bounceOffset = Math.sin(value * Math.PI) * 50; // Sine wave bounce
    textElement().x(basePosition + bounceOffset);
  }),
  
  // Fade out element over longer duration
  tween(fadeAnimationDuration, value => {
    const opacity = 1 - value; // Inverse progress for fade out
    textElement().opacity(opacity);
  })
);
```

## Project Standards

### File Organization
- Keep related functionality together
- Use descriptive directory names
- Follow established project structure
- Maintain consistent file naming patterns

### Version Control
- Write clear, English commit messages
- Use descriptive branch names
- Include context in pull request descriptions
- Document breaking changes
