# Revideo Animation Development Guide

## Project Structure Variables
- `{WORKSPACE_ROOT}` - Root directory of the Revideo project
- `{EXAMPLES_DIR}` - `packages/examples/src/` (relative to workspace root)
- `{SCENES_DIR}` - `packages/examples/src/scenes/` (relative to workspace root)
- `{VITE_CONFIG}` - `packages/examples/vite.config.ts` (relative to workspace root)

## Animation Analysis & Conversion Patterns

### Timing Conversion
- **CSS durations** → Revideo `tween()` calls
- **Easing mapping**: 
  - `ease-in-out` → `easeInOutCubic`
  - `linear` → `linear` 
  - Custom cubic-bezier → Use appropriate Revideo easing
- **Keyframes**: Convert CSS `@keyframes` to `yield*` animation sequences

### Transform Mapping
- **CSS transforms** → Revideo component properties:
  - `translateX/Y` → `position()` or `x()/y()`
  - `scale` → `scale()`
  - `rotate` → `rotation()`
  - `opacity` → `opacity()`

### Component Mapping
- **Text elements** → `<Txt>` components with `fontSize`, `fill`, `fontFamily`
- **Div containers** → `<Layout>` or `<Node>` components
- **Background images** → `<Img>` components or composite operations
- **Shapes** → `<Rect>`, `<Circle>`, or custom components
- **Gradients** → Use `Color.lerp()` for color transitions (avoid CSS gradient strings)

### Advanced Effects Implementation
- **Shadows**: Use `shadowBlur`, `shadowColor`, `shadowOffset` properties
- **Masking**: Implement using `compositeOperation: 'source-in'`
- **Layering**: Use multiple components with proper `zIndex` ordering
- **Blur effects**: Use `shadowBlur` instead of CSS filters
- **Multi-layer animations**: Use `all()` for parallel animations

## Code Standards and Language Requirements

### MANDATORY: English Only Policy
- **Language**: Use English ONLY for all comments, documentation, variable names, and function names
- **Comments**: Write clear, descriptive comments explaining animation logic, timing, and visual effects
- **Naming Conventions**: 
  - Use camelCase for variables and functions: `animationDuration`, `textElement`
  - Use PascalCase for components and scene names: `SpinningText`, `MatrixRain`
  - Use descriptive names that explain purpose: `fadeInDuration` not `dur`
- **Documentation**: Include brief JSDoc comments for complex animation functions

### Code Examples
```tsx
// ✅ CORRECT: English comments and descriptive naming
const rotationDuration = 4; // Duration for complete rotation in seconds
const textElement = createRef<Txt>();

// Apply continuous rotation animation with smooth easing
yield* tween(rotationDuration, value => {
  const angle = value * 360; // Convert progress to degrees
  textElement().rotation(angle);
});

// ❌ WRONG: Non-English comments or unclear naming
const dur = 4; // 旋转时间
const t = createRef<Txt>();
yield* tween(dur, v => t().rotation(v * 360));
```

## Project Structure Templates

### Basic Project Structure
```typescript
// {EXAMPLES_DIR}/{animation-name}.ts
import {makeProject} from '@revideo/core';
import {animationName} from './scenes/{animation-name}';

export default makeProject({
  scenes: [animationName],
  variables: {
    // Optional: define variables accessible in scenes
  },
});
```

### Import Guidelines
- **Standard ES6 imports**: Use normal import syntax without special suffixes
- **No `?scene` suffix**: This was a documentation error - use regular imports
- **File extensions**: Import `.tsx` scene files without the extension

### Naming Convention for Imports
- Use **camelCase** for import names that match the animation name
- Examples:
  - `matrix-rain.ts` → `import matrixRain from './scenes/matrix-rain';`
  - `shadow-dance.ts` → `import shadowDance from './scenes/shadow-dance';`
  - `melting-text.ts` → `import meltingText from './scenes/melting-text';`

### Basic Scene Structure
```tsx
// {SCENES_DIR}/{animation-name}.tsx
import {makeScene2D, Txt, Circle, Layout} from '@revideo/2d';
import {createRef, tween, waitFor, all, loop, easeInOutCubic, Color} from '@revideo/core';

export default makeScene2D('animation-name', function* (view) {
  const elementRef = createRef<ComponentType>();
  
  // Set background color for the scene
  view.fill('#000000');
  
  // Use Layout for proper centering and component management
  view.add(
    <Layout
      width={'100%'}
      height={'100%'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      <ComponentType 
        ref={elementRef}
        // Add component properties here
      />
    </Layout>
  );
  
  // Define animation transformations with proper timing
  yield* tween(duration, value => {
    // Animation logic goes here
    elementRef().scale(1 + value);
  });
  
  // CRITICAL: Always end scenes with waitFor to keep animations visible
  yield* waitFor(10);
});
```

## Animation Patterns

### Generator Function Rules
- **Sequential**: `yield* tween()` - blocks until complete, produces multiple frames
- **Parallel**: `yield* all(tween1, tween2)` - runs simultaneously  
- **Infinite loops**: `yield loop(Infinity, function* () { yield* tween(); })` - IMPORTANT: Use `yield` not `yield*`
- **Finite loops**: `yield* loop(count, function* () { yield* tween(); })` - Use `yield*` for specific iteration count
- **Background loops**: `spawn(loop(...))` - for concurrent execution without blocking
- **Delays**: `yield* waitFor(seconds)` - produces multiple frames over time
- **Component addition**: `view.add(<Layout>...</Layout>)` - NO yield unless external assets
- **Asset loading**: Only `yield` when adding components with external resources (images, custom fonts)
- **Scene persistence**: ALWAYS end with `yield* waitFor(duration)` to display animations in timeline

### Critical Loop Syntax Rules
- **Infinite loops**: Always use `yield loop(Infinity, ...)` - runs concurrently in separate thread
- **Finite loops**: Always use `yield* loop(count, ...)` - blocks main thread until complete
- **Background loops**: Use `spawn(loop(...))` for non-blocking concurrent execution
- **Error**: `yield* loop(Infinity, ...)` will throw "infinite loop in main thread" error

### Layout & Scene Management Rules
- **Layout Component**: ALWAYS use `<Layout>` for proper centering and component management
  ```tsx
  view.add(
    <Layout width={'100%'} height={'100%'} alignItems={'center'} justifyContent={'center'}>
      {/* Your components here */}
    </Layout>
  );
  ```
- **Scene Persistence**: ALWAYS end scenes with `yield* waitFor(duration)` to display animations in timeline
  - Without this, animations may not appear in the editor timeline
  - Recommended duration: `yield* waitFor(10)` or `yield* waitFor(15)`
- **Component Addition**: Use `view.add()` directly without `yield` for most components
  - Only use `yield` when adding external assets (images, custom fonts)

### Yield vs Yield* Rules
- **`yield`**: For single operations that may create promises (asset loading, node addition)
  - `yield view.add(<Img src="..." />)` - waits for image to load
  - `yield view.add(<Txt text="..." />)` - waits for fonts to load (only for custom fonts)
  - `yield loop(Infinity, ...)` - starts infinite background loop
- **`yield*`**: For generators that produce multiple frames over time
  - `yield* waitFor(2)` - produces frames for 2 seconds
  - `yield* tween(1, ...)` - produces frames for 1 second animation
  - `yield* all(...)` - produces frames for parallel operations
  - `yield* loop(5, ...)` - executes loop 5 times with frame production
- **No yield**: For immediate operations that don't need frame synchronization
  - `circleRef().remove()` - immediately removes node
  - `textRef().fill('red')` - immediately changes property
  - `view.add(<Txt>...)` - adds basic text components (standard fonts)

## Integration Requirements
- Add new projects to `{VITE_CONFIG}` in the project array
- Follow proper import/export patterns
- Ensure TypeScript compilation passes
- Test in development server before completion

## Common Gotchas and Best Practices
- Use proper component references with `createRef<ComponentType>()`
- Import specific easing functions like `easeInOutCubic`
- Use `Color` class or string values, not CSS gradient strings
- Apply `cache` prop on `<Node>` for expensive operations
- Always use descriptive English names for variables and functions
- Include timing explanations in comments for complex animations
- Test animations in both development and build environments

## Development Workflow

### Code → Build → Test Process
1. **Write Code**: Create project and scene files with proper structure
2. **Compilation Check**: Run `npm run examples:build` to verify TypeScript compilation
3. **Error Resolution**: Fix any compilation errors before proceeding
4. **Server Status Check**: Verify if development server is already running
   - Look for existing terminal processes with `npm run dev` or similar
   - Check if server is accessible (usually runs on http://localhost:3000 or similar)
5. **Server Management**: 
   - **If server is running**: Skip server startup, inform user to check browser
   - **If server is not running**: Start with `npm run examples:dev`
6. **User Testing**: User verifies animation effects in browser
7. **Iteration**: Return to step 1 for refinements if needed

### Build Verification Workflow
```bash
# Step 1: Check compilation
cd /path/to/revideo/packages/examples
npm run build

# Step 2: Only start server if not already running
# Check terminal processes first, then:
npm run examples:dev  # Only if needed
```

### Server Status Detection
- **Check existing terminals**: Look for active `npm run dev` processes
- **Port checking**: Development servers typically run on standard ports
- **Process management**: Avoid duplicate server instances
- **User notification**: Inform user when server is already available
