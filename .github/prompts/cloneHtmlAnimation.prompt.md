# HTML/CSS Animation to Revideo Scene Converter

## Project S```typescript
// {EXAMPLES_DIR}/{animation-name}.ts
import {makeProject} from '@revideo/core';
import {animationName} from './scenes/{animation-name}';

export default makeProject({
  scenes: [animationName],
  variables: {
    // Optional: define variables accessible in scenes
  },
});
```iables
- `{WORKSPACE_ROOT}` - Root directory of the Revideo project
- `{EXAMPLES_DIR}` - `packages/examples/src/` (relative to workspace root)
- `{SCENES_DIR}` - `packages/examples/src/scenes/` (relative to workspace root)
- `{VITE_CONFIG}` - `packages/examples/vite.config.ts` (relative to workspace root)

## Task Overview
Convert the provided HTML/CSS animation into a fully functional Revideo scene. Analyze the HTML structure, CSS animations, and visual effects, then recreate them using Revideo's animation system with proper timing, easing, and visual fidelity.

## Requirements

### 1. Project and Scene Creation
- Create a new project file in `{EXAMPLES_DIR}` directory
- Use the pattern: `{animation-name}.ts` (e.g., `shadow-dance.ts`, `melting-text.ts`)
- Create corresponding scene file in `{SCENES_DIR}` directory
- Use the pattern: `{animation-name}.tsx` for scene files
- Export scene using `makeScene2D` with descriptive scene name
- Export project using `makeProject` with scenes array
- Follow Revideo's generator function pattern with `function* (view)`

### 2. Animation Analysis & Conversion
- **Timing**: Convert CSS animation durations to Revideo `tween()` calls
- **Easing**: Map CSS easing functions to Revideo equivalents:
  - `ease-in-out` → `easeInOutCubic`
  - `linear` → `linear` 
  - Custom cubic-bezier → Use appropriate Revideo easing
- **Keyframes**: Convert CSS `@keyframes` to `yield*` animation sequences
- **Transforms**: Map CSS transforms to Revideo component properties:
  - `translateX/Y` → `position()` or `x()/y()`
  - `scale` → `scale()`
  - `rotate` → `rotation()`
  - `opacity` → `opacity()`

### 3. Component Mapping
- **Text elements** → `<Txt>` components with `fontSize`, `fill`, `fontFamily`
- **Div containers** → `<Layout>` or `<Node>` components
- **Background images** → `<Img>` components or composite operations
- **Shapes** → `<Rect>`, `<Circle>`, or custom components
- **Gradients** → Use `Color.lerp()` for color transitions (avoid CSS gradient strings)

### 4. Advanced Effects Implementation
- **Shadows**: Use `shadowBlur`, `shadowColor`, `shadowOffset` properties
- **Masking**: Implement using `compositeOperation: 'source-in'`
- **Layering**: Use multiple components with proper `zIndex` ordering
- **Blur effects**: Use `shadowBlur` instead of CSS filters
- **Multi-layer animations**: Use `all()` for parallel animations

### 5. Code Patterns to Follow

#### Code Standards and Language Requirements
- **Language**: MANDATORY - Use English ONLY for all comments, documentation, variable names, and function names
- **Comments**: Write clear, descriptive comments explaining animation logic, timing, and visual effects
- **Naming Conventions**: 
  - Use camelCase for variables and functions: `animationDuration`, `textElement`
  - Use PascalCase for components and scene names: `SpinningText`, `MatrixRain`
  - Use descriptive names that explain purpose: `fadeInDuration` not `dur`
- **Documentation**: Include brief JSDoc comments for complex animation functions

#### Basic Project Structure:
```typescript
// {EXAMPLES_DIR}/{animation-name}.ts
import {makeProject} from '@revideo/core';
import {animationName} from './scenes/{animation-name}?scene';

export default makeProject({
  scenes: [{animationName}],
  variables: {
    // Optional: define variables accessible in scenes
  },
});
```

#### Naming Convention for Imports:
- Use **camelCase** for import names that match the animation name
- Examples:
  - `matrix-rain.ts` → `import matrixRain from './scenes/matrix-rain';`
  - `shadow-dance.ts` → `import shadowDance from './scenes/shadow-dance';`
  - `melting-text.ts` → `import meltingText from './scenes/melting-text';`

#### Basic Scene Structure:
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

#### Animation Patterns:
- **Sequential**: `yield* tween()` - blocks until complete, produces multiple frames
- **Parallel**: `yield* all(tween1, tween2)` - runs simultaneously  
- **Infinite loops**: `yield loop(Infinity, function* () { yield* tween(); })` - IMPORTANT: Use `yield` not `yield*`
- **Finite loops**: `yield* loop(count, function* () { yield* tween(); })` - Use `yield*` for specific iteration count
- **Background loops**: `spawn(loop(...))` - for concurrent execution without blocking
- **Delays**: `yield* waitFor(seconds)` - produces multiple frames over time
- **Component addition**: `view.add(<Layout>...</Layout>)` - NO yield unless external assets
- **Asset loading**: Only `yield` when adding components with external resources (images, custom fonts)
- **Scene persistence**: ALWAYS end with `yield* waitFor(duration)` to display animations in timeline

### 6. Integration Requirements
- Add the new project to `{VITE_CONFIG}` in the project array
- Add entry: `'./src/{animation-name}.ts'` to the motionCanvas plugin configuration
- Import pattern: `import {animationNameCamelCase} from './scenes/{animation-name}';` in project file
- Project structure: Use `makeProject({ scenes: [{animationNameCamelCase}] })` pattern
- Ensure proper scene duration and transitions

### 7. Quality Standards
- **Performance**: Use `cache` prop for expensive operations
- **Reactivity**: Prefer signal-based properties over manual updates
- **Type safety**: Use proper TypeScript types with `createRef<ComponentType>()`
- **Visual fidelity**: Match original animation as closely as possible
- **Timing accuracy**: Preserve original animation durations and delays
- **Code documentation**: Write all comments in English for consistency and maintainability

### 8. Common Gotchas to Avoid
- Don't use `motion-canvas` imports - use `@revideo/2d` and `@revideo/core`
- **Don't use `yield* loop(Infinity, ...)` for infinite loops** - use `yield loop(Infinity, ...)` instead
- **Don't use `yield loop(count, ...)` for finite loops** - use `yield* loop(count, ...)` instead
- **Always use `yield` for asset loading** - `yield view.add(<Img src="..." />)` to await image loading
- **Always use `yield` for text with custom fonts** - to await `document.fonts.ready` event
- **Use `yield*` for time-based operations** - `yield* waitFor()`, `yield* tween()` produce multiple frames
- **Use `yield` for single operations** - `yield view.add()` for adding nodes without time delay
- Don't use CSS gradient strings - use `Color` class or RGBA values
- Don't forget to import specific easing functions like `easeInOutCubic`
- Always use absolute file paths when referencing assets
- **Write all code comments in English** for consistency across the codebase
- **Avoid overly complex animations in first attempt** - start with simple version, then add complexity
- **Avoid dynamic JSX generation** - prefer static component creation with refs over `Array.from()` in JSX
- **Avoid function-based props** - use direct values and animate via refs instead of `prop={() => ...}`

## Success Criteria
1. ✅ Animation visually matches the original HTML/CSS version
2. ✅ Timing and easing curves are preserved
3. ✅ Scene integrates properly with existing project
4. ✅ Code follows Revideo best practices and patterns
5. ✅ No console errors or performance issues
6. ✅ TypeScript compilation succeeds without errors

## Deliverables
1. New project file in `{EXAMPLES_DIR}` directory
2. New scene file in `{SCENES_DIR}` directory  
3. Updated `{VITE_CONFIG}` with new project entry
4. **Build verification**: Run `npm run examples:build` to check for compilation errors
5. **Error fixing**: Fix any TypeScript or build errors before completion
6. Brief explanation of key animation techniques used
7. Any custom components or utilities if needed

## Development Workflow
1. **Create files**: Project and scene files with proper naming
2. **Start simple**: Begin with basic animation, avoid complexity initially  
3. **Use Layout**: Always wrap components in `<Layout>` for proper centering
4. **English only**: Ensure all comments, documentation, and variable names are in English
5. **Build and test**: Run `npm run examples:build` after creation
6. **Fix errors**: Address any compilation or runtime errors
7. **Check loop syntax**: Ensure correct `yield` vs `yield*` usage for loops
8. **Add waitFor**: Ensure scene ends with `yield* waitFor(duration)` for timeline visibility
9. **Add complexity**: Gradually enhance the animation once basic version works
10. **Final verification**: Ensure animation loads and runs in development server

## Critical Loop Syntax Rules
- **Infinite loops**: Always use `yield loop(Infinity, ...)` - runs concurrently in separate thread
- **Finite loops**: Always use `yield* loop(count, ...)` - blocks main thread until complete
- **Background loops**: Use `spawn(loop(...))` for non-blocking concurrent execution
- **Error**: `yield* loop(Infinity, ...)` will throw "infinite loop in main thread" error

## Layout & Scene Management Rules
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

## Yield vs Yield* Rules
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

## User Input Format
Provide the HTML and CSS code for the animation you want to recreate:

```html
<!-- HTML structure -->
```

```css
/* CSS animations and styles */
```

The agent will analyze this input and create a corresponding Revideo scene automatically.