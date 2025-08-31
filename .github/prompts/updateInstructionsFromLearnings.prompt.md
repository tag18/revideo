# Update Instructions and Prompts from Key Learnings

## Task Overview
After solving technical problems or discovering new patterns in Revideo development, update the project's instruction files and prompts to prevent similar issues from recurring. This ensures that future development benefits from lessons learned and maintains consistency across the codebase.

## Target Files to Update
1. **`.github/copilot-instructions.md`** - Main AI coding agent instructions
2. **`.github/prompts/cloneHtmlAnimation.prompt.md`** - HTML to Revideo conversion guidelines
3. **Other prompt files** - As needed based on the nature of the learnings

## Key Learning Categories to Document

### 1. Syntax and Pattern Corrections
- **Yield vs Yield* Usage**: Document correct generator function patterns
- **Loop Syntax**: Clarify infinite vs finite loop implementations
- **Import Patterns**: Correct module import syntax and naming conventions
- **Component Usage**: Proper component instantiation and property setting

### 2. Animation Workflow Issues
- **Timeline Visibility**: Patterns that ensure animations appear in the editor timeline
- **Scene Persistence**: Requirements for keeping scenes running to display animations
- **Component Lifecycle**: When to use `yield` vs direct component addition
- **Animation Timing**: Correct sequencing and parallel execution patterns

### 3. Layout and Rendering Problems
- **Centering Issues**: Proper use of Layout components for positioning
- **Z-Index Problems**: Layering and depth management solutions
- **Responsive Behavior**: Ensuring animations work across different screen sizes
- **Performance Issues**: Patterns that improve rendering performance

### 4. Build and Development Issues
- **Compilation Errors**: Common TypeScript and build configuration problems
- **Runtime Errors**: Patterns that prevent common runtime failures
- **Development Server Issues**: Configuration problems and solutions
- **Integration Problems**: Issues with adding new scenes to projects

## Update Process

### 1. Identify Key Learnings
Analyze the recently solved problem to extract:
- **Root Cause**: What was the fundamental issue?
- **Incorrect Pattern**: What was being done wrong?
- **Correct Pattern**: What is the proper way to implement it?
- **Prevention Strategy**: How can this be avoided in the future?

### 2. Update copilot-instructions.md
- **Scene Creation Pattern**: Update code examples with correct patterns
- **Animation Patterns**: Add or modify animation guidelines
- **Component Library**: Update component usage documentation
- **Common Gotchas**: Add new gotchas or refine existing ones
- **Development Workflow**: Improve build and testing procedures

### 3. Update cloneHtmlAnimation.prompt.md
- **Basic Scene Structure**: Enhance template code with best practices
- **Animation Patterns**: Update generator function guidelines
- **Critical Rules Sections**: Add new rules or clarify existing ones
- **Development Workflow**: Improve step-by-step processes
- **Error Prevention**: Add specific error scenarios and solutions

### 4. Create New Prompts (if needed)
If the learnings reveal a new workflow or process, consider creating:
- Specialized prompt files for specific animation types
- Debugging and troubleshooting prompts
- Performance optimization prompts
- Testing and validation prompts

## Update Patterns to Follow

### Code Examples
- Always include complete, working code examples
- Show both incorrect and correct patterns when useful
- Include necessary imports and proper file structure
- Demonstrate proper error handling
- **Language requirement**: All comments and documentation must be in English only

### Documentation Structure
- Use clear headings and bullet points
- Include "ALWAYS", "NEVER", "CRITICAL" emphasis for important rules
- Provide context for why certain patterns are preferred
- Link related concepts together
- **Language consistency**: Maintain English throughout all documentation

### Practical Guidelines
- Focus on actionable instructions rather than theory
- Include specific file paths and naming conventions
- Provide step-by-step procedures for complex processes
- Include validation steps to verify correct implementation

## Common Learning Scenarios

### Animation Not Displaying
**Problem**: Animation compiles but doesn't show in timeline or preview
**Key Learnings**:
- Scene must end with `yield* waitFor(duration)`
- Infinite loops need `yield` not `yield*`
- Components should be wrapped in Layout for proper management

### Component Positioning Issues
**Problem**: Elements not centering or positioning correctly
**Key Learnings**:
- Always use `<Layout>` component for centering
- Understand flexbox properties in Revideo context
- Proper use of `position`, `alignItems`, `justifyContent`

### Build and Runtime Errors
**Problem**: TypeScript compilation errors or runtime failures
**Key Learnings**:
- Correct import syntax and module resolution
- Proper component reference typing
- Asset loading patterns and error handling

### Performance Problems
**Problem**: Slow rendering or memory issues
**Key Learnings**:
- When to use `cache` property on nodes
- Efficient animation patterns
- Proper cleanup and resource management

## Validation Checklist
After updating instruction files:

- [ ] **Code Examples Compile**: Test all new code examples
- [ ] **Patterns are Consistent**: Ensure consistency across all instruction files
- [ ] **Clarity Check**: Review for clear, actionable language
- [ ] **Cross-References**: Update related sections that reference changed patterns
- [ ] **Practical Testing**: Verify new guidelines work in practice
- [ ] **Backward Compatibility**: Ensure changes don't break existing patterns

## Expected Outcomes
- **Reduced Recurring Issues**: Same problems don't happen repeatedly
- **Faster Development**: Developers can follow proven patterns
- **Better Code Quality**: Consistent application of best practices
- **Improved Documentation**: Living documentation that evolves with learnings
- **Enhanced Productivity**: Less time spent debugging common issues

## File Update Templates

### For copilot-instructions.md:
```markdown
## Common Gotchas
[Add new gotcha with number, description, and example]

## [Relevant Section]
[Update existing patterns with corrected examples]
```

### For cloneHtmlAnimation.prompt.md:
```markdown
## [New Section Name] Rules
- **Pattern Name**: Description and usage guidelines
  ```tsx
  // Example code showing correct implementation
  ```

#### [Updated Section]:
[Enhanced guidelines with new learnings integrated]
```

## Success Metrics
- Reduced time to resolve similar issues in the future
- Fewer repeated questions about the same patterns
- Improved consistency in codebase implementations
- Better onboarding experience for new developers
- More reliable animation development workflow
