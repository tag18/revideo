import {useScene} from '../utils';

/**
 * Create a bookmark at the current time in the animation.
 * 
 * @remarks
 * Bookmarks appear as markers on the timeline in the editor, allowing you to:
 * - Quickly navigate to specific points in your animation
 * - Add notes or labels to mark important moments
 * - Organize your timeline with visual references
 * 
 * Unlike `waitUntil()`, bookmarks don't affect timing or execution flow.
 * They are purely visual markers for navigation and organization.
 * 
 * @example
 * ```ts
 * import {bookmark} from '@revideo/core';
 * 
 * export default makeScene2D(function* (view) {
 *   // Mark the start of the intro section
 *   bookmark('intro-start');
 *   
 *   yield* fadeInTitle();
 *   
 *   // Mark when main animation begins
 *   bookmark('main-animation', '#4CAF50');
 *   
 *   yield* mainAnimation();
 *   
 *   // Mark the finale with a custom color
 *   bookmark('finale', '#e13238');
 * });
 * ```
 * 
 * @param name - The name of the bookmark. Must be unique within the scene.
 * @param color - Optional color for the bookmark marker (hex format).
 */
export function bookmark(name: string, color?: string): void {
  const scene = useScene();
  const thread = scene.playback;
  const currentTime = thread.framesToSeconds(thread.frame);
  
  // Capture stack trace for navigation to source
  const stack = new Error().stack;
  
  scene.bookmarks.add(name, currentTime, color, stack);
}
