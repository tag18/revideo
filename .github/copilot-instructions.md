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
- **`yield*`**: Delegates to another generator, produces multiple frames
- **`yield`**: Returns a single value (Promise or otherwise), pauses execution
- **`createRef<ComponentType>()`**: Get component references for animation
- **`tween(duration, callback)`**: Core animation primitive - always use with `yield*`
- **`all(...animations)`**: Run animations in parallel - always use with `yield*`
- **`loop(Infinity, animation)`**: Infinite loops - use `yield` not `yield*`
- **`loop(count, animation)`**: Finite loops - use `yield*` for frame production
- **`waitFor(seconds)`**: Time delays - always use with `yield*`
- **Scene persistence**: Always end scenes with `yield* waitFor(duration)` to keep animations visible

### Understanding `yield` vs `yield*` vs no yield

#### When does a frame get rendered?
A common misconception is that every `yield` corresponds to a frame. In reality:
- **Frames are only rendered when the yielded value is falsy** (undefined, null, false, etc.)
- **Non-falsy values (Promises, objects) don't render frames** - they're awaited/processed first

**Frame rendering logic (simplified):**
```typescript
let result = scene.next();

// We don't draw a frame while the yield is not empty
while (result.value) {
  if (isPromise(result.value)) {
    result = await result.value;
  } else {
    console.warn('Invalid value yielded by the scene.');
  }
  result = scene.next();
}

// When result is empty (while loop passed), we render a frame
drawFrame();
```

#### `yield` - Single operations, awaits promises
Use `yield` to:
- **Await promises** from async operations (image loading, font loading, etc.)
- **Pause execution** without producing a frame (unless value is falsy)
- **Return a single value** to the generator

```tsx
// ✅ yield view.add() - Awaits any promises from component construction
yield view.add(<Img src={'img.png'} />);  // Awaits image load, NO frame rendered

// ✅ yield Promise - Awaits async operations
const data = yield fetch('api/data');  // Awaits fetch, NO frame rendered

// ✅ Empty yield - Renders ONE frame
yield;  // Falsy value → renders a frame

// Example: 30 frames (1 second at 30fps)
for (let i = 0; i < 30; i++) {
  yield;  // Each empty yield = 1 frame
}
```

#### `yield*` - Generator delegation, produces multiple frames
Use `yield*` to:
- **Delegate to another generator function** that produces multiple frames
- **Run time-based animations** (tween, waitFor, all)
- **Execute sequences** of frame-producing operations

```tsx
// ✅ yield* waitFor() - Produces multiple frames over time
yield* waitFor(1);  // Produces 30 frames (1 second at 30fps)

// ✅ yield* tween() - Produces frames during animation
yield* tween(2, value => {
  circle().scale(1 + value);
});  // Produces 60 frames (2 seconds)

// ✅ yield* all() - Parallel animations
yield* all(
  tween(1, value => circle().x(value * 100)),
  tween(1, value => text().opacity(value)),
);  // Produces frames for both animations

// This is equivalent to:
yield* waitFor(1);
// vs manually:
for (let i = 0; i < 30; i++) {
  yield;  // 30 empty yields = 30 frames
}
```

#### No yield - Immediate execution, no waiting
Use direct calls (no yield) when:
- **Adding components** without external dependencies (no images, fonts, etc.)
- **Setting properties** synchronously
- **Performing calculations** that don't need waiting

```tsx
// ✅ No yield - Simple component addition
view.add(
  <Circle size={100} fill="#ff0000" />
);  // No async operations, no yield needed

// ✅ No yield - Setting properties
circle().fill('#00ff00');
circle().position([100, 200]);

// ⚠️ But if loading external resources, use yield:
yield view.add(<Img src="external.png" />);  // Has async image loading
yield view.add(<Txt fontFamily="CustomFont">Text</Txt>);  // May need font loading
```

#### Official Recommendation: "yield every add call"
From Revideo docs:
> "Adding a **yield** in front of an operation ensures that Revideo awaits any promises associated with that operation, such as network requests or awaiting fonts to load. If you want to be safe, you can simply **yield every add call** - this is a good catch-all and won't cause problems."

**Example:**
```tsx
// ✅ Safe approach: Always yield view.add()
yield view.add(
  <>
    <Txt>Text might need font loading</Txt>
    <Img src="image.png" />
    <Circle />
  </>
);

// If you don't yield and there are async operations:
// ⚠️ Warning: "Tried to access an asynchronous property before the node was ready"
```

#### Summary Table

| Syntax | Use Case | Produces Frames? | Example |
|--------|----------|------------------|---------|
| `yield` | Await promises, single operations | Only if value is falsy | `yield view.add(<Img/>)` |
| `yield*` | Delegate to generators, animations | Yes, multiple frames | `yield* waitFor(1)` |
| No yield | Synchronous operations | No | `view.add(<Circle/>)` |
| Empty `yield` | Single frame | Yes, exactly 1 frame | `yield;` |

### Component Styling
- Use **signal functions** for dynamic properties: `fill={() => someSignal()}`
- **Color interpolation**: `Color.lerp(color1, color2, progress)`
- **Composite operations**: `compositeOperation: 'source-in'` for masking
- **Z-indexing**: `zIndex` prop for layering

## Development Workflow

### Building & Running

**IMPORTANT BUILD RULES:**
- **Full project build**: `npm run build` in workspace root `/Users/xmbms/github/video.ai/revideo`
- **Package-specific builds**: Only needed when modifying core packages
  - `npm run core:build` - When modifying `packages/core`
  - `npm run 2d:build` - When modifying `packages/2d` (editor, components, etc.)
  - `npm run ui:build` - When modifying `packages/ui`
- **Examples**: Modifying `packages/examples` (scenes, project files) does NOT require rebuild
  - Just use `npm run examples:dev` for hot reload
  - Only run `npm run examples:build` to check for TypeScript errors

```bash
# Full project build (all packages)
npm run build

# Build specific package (only when modifying that package)
npm run core:build     # Modified packages/core
npm run 2d:build       # Modified packages/2d (Provider.tsx, components, etc.)
npm run ui:build       # Modified packages/ui

# Examples (no rebuild needed for scene changes)
npm run examples:build  # Check TypeScript errors only
npm run examples:dev    # Start dev server with hot reload
npm run test           # Run all tests
```

### Development Process
1. **Write Code**: Create scene and project files with proper structure
2. **Rebuild if needed**: 
   - Modified core packages? → Run specific package build (e.g., `npm run 2d:build`)
   - Modified examples only? → No rebuild needed, hot reload handles it
3. **Compile Check**: Run `npm run examples:build` to check for TypeScript errors
4. **Server Management**: 
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
17. **Build requirements**: 
    - Modifying `packages/2d`, `packages/core`, or `packages/ui` requires running package-specific build (e.g., `npm run 2d:build`)
    - Modifying `packages/examples` (scenes, project files) does NOT require rebuild - hot reload handles it automatically
    - Use `npm run build` in workspace root only for full project rebuild

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
