# Revideo AI Coding Agent Instructions

## Project Structure Variables
- `{WORKSPACE_ROOT}` - Root directory of the Revideo project  
- `{EXAMPLES_DIR}` - `packages/examples/src/` (relative to workspace root)
- `{SCENES_DIR}` - `packages/examples/src/scenes/` (relative to workspace root)

## Architecture Overview

Revideo is a **monorepo** built with **Lerna** and **npm workspaces** for programmatic video creation. It's forked from Motion Canvas but designed as a **library** rather than a standalone editor, with focus on **headless rendering** and **API deployment**.

### Core Packages Structure
- **`@revideo/core`**: Animation engine, signals, threading, scene management
- **`@revideo/2d`**: 2D renderer with React-like JSX components (`<Txt>`, `<Rect>`, `<Circle>`, etc.)
- **`@revideo/renderer`**: Headless Puppeteer-based video rendering
- **`@revideo/ui`**: Editor UI (Preact-based)
- **`@revideo/vite-plugin`**: Vite integration for development

## Key Patterns

### Scene Creation Pattern
```tsx
import {makeScene2D, Txt, Circle, Layout} from '@revideo/2d';
import {createRef, tween, waitFor, loop} from '@revideo/core';

export default makeScene2D('scene-name', function* (view) {
  const elementRef = createRef<Circle>();
  
  // Use Layout for proper centering and component management
  view.add(
    <Layout
      width={'100%'}
      height={'100%'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      <Circle ref={elementRef} size={100} fill="#ff0000" />
    </Layout>
  );
  
  // Use yield* for time-based animations
  yield* tween(2, value => {
    elementRef().scale(1 + value);
  });
  
  // Keep scene running to show animations
  yield* waitFor(10);
});
```

### Code Standards
- **Language**: ALWAYS use English for all comments, documentation, variable names, and function names
- **Comments**: Write descriptive comments explaining animation logic and timing
- **Naming**: Use camelCase for variables and functions, PascalCase for components
- **Documentation**: All scene exports should have brief descriptions of their purpose

### Project Configuration Pattern
Projects use a **main file** (like `camera-scene.ts`) that imports scenes and configures:
```tsx
import {makeProject} from '@revideo/core';
import sceneOne from './scenes/scene-one';

export default makeProject({
  scenes: [sceneOne],
  variables: {
    // Optional: define variables accessible in scenes
    videoFile: 'default-video.mp4',
  },
});
```

### Animation Patterns
- **`yield*`**: Blocks until animation completes, produces multiple frames
- **`yield`**: Single operations, awaits promises, doesn't produce frames unless falsy
- **`createRef<ComponentType>()`**: Get component references for animation
- **`tween(duration, callback)`**: Core animation primitive - always use with `yield*`
- **`all(...animations)`**: Run animations in parallel - always use with `yield*`
- **`loop(Infinity, animation)`**: Infinite loops - use `yield` not `yield*`
- **`loop(count, animation)`**: Finite loops - use `yield*` for frame production
- **`waitFor(seconds)`**: Time delays - always use with `yield*`
- **Scene persistence**: Always end scenes with `yield* waitFor(duration)` to keep animations visible

### Component Styling
- Use **signal functions** for dynamic properties: `fill={() => someSignal()}`
- **Color interpolation**: `Color.lerp(color1, color2, progress)`
- **Composite operations**: `compositeOperation: 'source-in'` for masking
- **Z-indexing**: `zIndex` prop for layering

## Development Workflow

### Building & Running
```bash
# Build specific package
npm run core:build
npm run 2d:build

# Run all tests
npm run test

# Build examples with error checking
npm run examples:build

# Start development server (check if already running first)
npm run examples:dev
```

### Development Process
1. **Write Code**: Create scene and project files with proper structure
2. **Compile Check**: Run `npm run examples:build` to check for TypeScript errors
3. **Server Management**: 
   - Check if development server is already running (look for existing terminal processes)
   - Only start `npm run examples:dev` if not already running
   - User will check effects in browser after compilation succeeds
4. **Iteration**: Fix any compilation errors, rebuild, user tests in browser

### Vite Integration
Uses custom `@revideo/vite-plugin` with:
- **Preact** for UI components (not React)
- **TypeScript** with strict project references
- **Rollup** for bundling
- Alias configuration for development mode

## Component Library

### Essential 2D Components
- **`<Txt>`**: Text with `fontSize`, `fill`, `fontFamily`, `fontWeight`
- **`<Rect>`, `<Circle>`**: Basic shapes with `size`, `fill`, `stroke`
- **`<Layout>`**: Flexbox container with `alignItems`, `justifyContent` - **ALWAYS use for centering**
- **`<Img>`, `<Video>`, `<Audio>`**: Media components
- **`<Node>`**: Base component for custom elements

### Animation Utilities
- **Easing functions**: `easeInOutCubic`, `linear` (not `easeInOut`)
- **Signal management**: `createSignal()` for reactive values
- **Time control**: `waitFor(seconds)` for delays

## Rendering & Deployment

### Headless Rendering
Unlike Motion Canvas, Revideo supports:
- **Puppeteer-based** server-side rendering
- **FFmpeg integration** for video export
- **Parallelized rendering** for performance
- **API endpoints** for dynamic video generation

### Performance Considerations
- Use `cache` prop on `<Node>` for expensive operations
- Leverage **signal-based** reactivity over manual updates
- Consider `shadowBlur` instead of CSS filters for effects

## Common Gotchas

1. **Import paths**: Use `@revideo/2d` and `@revideo/core`, not `motion-canvas`
2. **Scene imports**: Use standard ES6 import: `import scene from './scenes/name'`
3. **Loop syntax**: Use `yield loop(Infinity, ...)` not `yield* loop(Infinity, ...)`
4. **Component addition**: Use `view.add(<Layout>...</Layout>)` directly, don't yield unless loading external assets
5. **Layout component**: ALWAYS use `<Layout>` for proper centering and component management
6. **Scene persistence**: ALWAYS end scenes with `yield* waitFor(duration)` to keep animations visible in timeline
7. **Asset loading**: Only `yield` when adding external resources: `yield view.add(<Img src="..." />)`
8. **Font loading**: Only `yield` when adding text with custom fonts that need loading
9. **Time operations**: Use `yield*` for `waitFor()`, `tween()`, `all()` - they produce frames
10. **Color values**: Use `Color` class or string values, not CSS gradient strings
11. **Component refs**: Always use `createRef<ComponentType>()` with proper typing
12. **Easing functions**: Import specific functions like `easeInOutCubic`
13. **Performance**: Use `cache` prop on `<Node>` for expensive operations
14. **Language requirement**: ALWAYS use English for comments, documentation, and variable names
15. **Server management**: Check if development server is running before attempting to start it
16. **Development flow**: Write code → Build check → User tests in browser (don't auto-start server)

## Language and Documentation Standards

### MANDATORY: English Only Policy
- **Comments**: All code comments must be written in English
  ```tsx
  // ✅ CORRECT: Calculate rotation angle based on time
  const angle = time * 360;
  
  // ❌ WRONG: 计算基于时间的旋转角度
  const angle = time * 360;
  ```

- **Variable Names**: Use descriptive English names
  ```tsx
  // ✅ CORRECT
  const animationDuration = 2;
  const fadeInEffect = createRef<Txt>();
  
  // ❌ WRONG
  const donghuaShijian = 2;
  const danruXiaoguo = createRef<Txt>();
  ```

- **Function Names**: Use English verb-noun patterns
  ```tsx
  // ✅ CORRECT
  function createSpinningText() { }
  function animateMatrixRain() { }
  
  // ❌ WRONG
  function chuangjianXuanzhuanWenben() { }
  ```

- **Documentation**: All JSDoc and README content in English
- **File Names**: Use English words with kebab-case: `spinning-text.tsx`, `matrix-rain.tsx`

### Code Quality Standards
- Write self-documenting code with clear English names
- Add comments for complex animation logic and timing
- Use consistent naming conventions across the entire project
- Document scene purposes and animation techniques used

## File Organization

### Scenes Structure
- Individual scenes in `{SCENES_DIR}` directory
- Export via `export default makeScene2D()`
- Import and configure in main project file

### Asset Management
- Media assets typically referenced via URLs
- Support for local files in `public/` directory
- Audio/video synchronization built-in
