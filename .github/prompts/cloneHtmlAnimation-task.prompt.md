# Clone HTML/CSS Animation to Revideo

## Task
Convert the provided HTML/CSS animation into a fully functional Revideo scene that matches the original visual effects and timing.

## Required Input
- HTML code with animation elements
- CSS code with keyframes, transitions, and styling
- Any additional assets or specifications

## Step-by-Step Process

### 1. Analysis Phase
- [ ] Identify animated elements and their properties
- [ ] Map CSS animations to Revideo patterns (see `/instructions/animation-development.md`)
- [ ] Note timing, easing, and sequence requirements
- [ ] Plan component structure and layering

### 2. File Creation
- [ ] Create project file: `{EXAMPLES_DIR}/{animation-name}.ts`
- [ ] Create scene file: `{SCENES_DIR}/{animation-name}.tsx`
- [ ] Use camelCase for import names matching file names

### 3. Implementation Checklist
- [ ] **Setup**: Import required Revideo components and utilities
- [ ] **Background**: Set appropriate background color/gradient
- [ ] **Layout**: Wrap all components in `<Layout>` for proper centering
- [ ] **Components**: Create component hierarchy matching HTML structure
- [ ] **Styling**: Apply colors, fonts, sizes to match CSS
- [ ] **Animation**: Implement timing and easing following Revideo patterns
- [ ] **Comments**: Add clear English comments explaining animation logic
- [ ] **Persistence**: End scene with `yield* waitFor(duration)` for timeline visibility

### 4. Code Standards Verification
- [ ] All comments and variable names in English
- [ ] Proper camelCase/PascalCase naming conventions
- [ ] Descriptive variable names explaining purpose
- [ ] Correct `yield` vs `yield*` usage
- [ ] Layout component used for centering
- [ ] Scene ends with waitFor for timeline visibility

### 5. Integration & Testing
- [ ] Add project entry to `{VITE_CONFIG}`
- [ ] Run `npm run examples:build` to check compilation
- [ ] Fix any TypeScript or build errors
- [ ] **Server Check**: Verify if development server is already running
- [ ] **Server Management**: Only start `npm run examples:dev` if server is not running
- [ ] **User Testing**: Inform user to check animation in browser

### 6. Quality Check
- [ ] Animation timing matches original
- [ ] Visual effects reproduce correctly
- [ ] Smooth performance without stuttering
- [ ] Proper loop behavior (if applicable)
- [ ] All interactive elements working (if applicable)

## Success Criteria
- ✅ Animation visually matches the provided HTML/CSS example
- ✅ Timing and easing feel identical to original
- ✅ Code follows Revideo best practices and English language standards
- ✅ No compilation or runtime errors
- ✅ Build completes successfully
- ✅ User can verify animation in browser (server management handled appropriately)

## Common Issues to Avoid
- Using `yield* loop(Infinity, ...)` instead of `yield loop(Infinity, ...)`
- Forgetting to end scene with `yield* waitFor(duration)`
- Not using Layout component for proper centering
- Using non-English comments or variable names
- Skipping yield for external asset loading
- Incorrect component reference types

## Deliverables
1. **Project file**: `{EXAMPLES_DIR}/{animation-name}.ts`
2. **Scene file**: `{SCENES_DIR}/{animation-name}.tsx`
3. **Updated config**: Add entry to `{VITE_CONFIG}`
4. **Verification**: Successful build and runtime test
5. **Documentation**: Brief explanation of key techniques used

## Reference Documentation
- Main development guide: `.github/instructions/animation-development.md`
- Core patterns: `.github/copilot-instructions.md`
- Project examples: `packages/examples/src/scenes/` directory
