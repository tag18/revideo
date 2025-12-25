import type {WordBoundary} from '../types';
import {waitFor, all, setTaskName} from '@revideo/core';

/**
 * Voiceover tracker for managing duration and bookmarks
 * Inspired by Manim-Voiceover's tracker system
 */
export class VoiceoverTracker {
  private _duration: number = 0;
  private _startTime: number = 0;
  private _currentTime: number = 0;
  private _bookmarkTimes: Map<string, number> = new Map();
  private _wordBoundaries: WordBoundary[] = [];
  private _timeGetter: (() => number) | null = null;
  private _isPlaying: boolean = false;  // Track if play() has been called

  constructor(
    duration: number = 0,
    wordBoundaries: WordBoundary[] = []
  ) {
    this._duration = duration;
    this._wordBoundaries = wordBoundaries;
  }

  /**
   * Set the time getter function (usually from the scene)
   * This allows the tracker to calculate elapsed and remaining time
   */
  setTimeGetter(timeGetter: () => number): void {
    this._timeGetter = timeGetter;
  }

  /**
   * Set the start time when audio playback begins
   */
  setStartTime(startTime: number): void {
    this._startTime = startTime;
    this._isPlaying = true;
  }

  /**
   * Get the total duration of the voiceover in seconds
   */
  get duration(): number {
    return this._duration;
  }

  /**
   * Get elapsed time since audio started playing
   * Returns 0 if time getter is not set or audio hasn't started
   */
  get elapsedTime(): number {
    if (!this._timeGetter || !this._isPlaying) {
      return 0;
    }
    return this._timeGetter() - this._startTime;
  }

  /**
   * Get remaining time until audio finishes
   * Returns full duration if audio hasn't started
   */
  get remainingTime(): number {
    const remaining = this.duration - this.elapsedTime;
    return Math.max(0, remaining);
  }

  /**
   * Set the total duration
   */
  setDuration(duration: number): void {
    this._duration = duration;
  }

  /**
   * Set word boundaries for bookmark tracking
   */
  setWordBoundaries(wordBoundaries: WordBoundary[]): void {
    this._wordBoundaries = wordBoundaries;
  }

  /**
   * Get word boundaries
   */
  getWordBoundaries(): WordBoundary[] {
    return this._wordBoundaries;
  }

  /**
   * Process bookmarks from text with markers like <bookmark mark='A'/>
   * This parses the original text and calculates timing for each bookmark
   */
  processBookmarks(text: string): void {
    this._bookmarkTimes.clear();

    if (!this._wordBoundaries || this._wordBoundaries.length === 0) {
      console.warn('No word boundaries available for bookmark processing');
      return;
    }

    // Calculate SSML offset by finding the first word in the original text
    // Azure's textOffset includes all SSML tags, but we need to work with the clean text
    let ssmlOffset = 0;
    if (this._wordBoundaries.length > 0) {
      const firstWord = this._wordBoundaries[0];
      // Find where this word appears in our clean text
      const firstWordIndexInText = text.indexOf(firstWord.text);
      if (firstWordIndexInText >= 0) {
        // ssmlOffset = Azure's textOffset for first word - position in clean text
        ssmlOffset = firstWord.textOffset - firstWordIndexInText;
      }
    }

    // Regular expression to match bookmarks: <bookmark mark='A'/> or <bookmark mark="A"/>
    const bookmarkRegex = /<bookmark\s+mark\s*=\s*['"](\w+)['"]\s*\/>/g;
    
    let match;

    // Find all bookmarks and use their position in the ORIGINAL text
    while ((match = bookmarkRegex.exec(text)) !== null) {
      const mark = match[1];
      const bookmarkPosition = match.index;
      
      // Azure's textOffset includes SSML prefix, so we need to add it
      // to our bookmark position to match Azure's coordinate system
      const textOffset = ssmlOffset + bookmarkPosition;
      
      // Find corresponding audio offset using word boundaries
      const audioOffset = this.interpolateAudioOffset(textOffset);
      
      // Store bookmark timing (in seconds)
      this._bookmarkTimes.set(mark, audioOffset / 1000);
    }
  }

  /**
   * Interpolate audio offset from text offset using word boundaries
   * Similar to Manim-Voiceover's TimeInterpolator
   */
  private interpolateAudioOffset(textOffset: number): number {
    if (this._wordBoundaries.length === 0) {
      console.warn('⚠️ No word boundaries available');
      return 0;
    }

    // Find the two word boundaries that surround this text offset
    let prevBoundary = this._wordBoundaries[0];
    let nextBoundary = this._wordBoundaries[this._wordBoundaries.length - 1];

    for (let i = 0; i < this._wordBoundaries.length - 1; i++) {
      const curr = this._wordBoundaries[i];
      const next = this._wordBoundaries[i + 1];

      if (textOffset >= curr.textOffset && textOffset <= next.textOffset) {
        prevBoundary = curr;
        nextBoundary = next;
        break;
      }
    }

    // Linear interpolation between boundaries
    if (prevBoundary.textOffset === nextBoundary.textOffset) {
      return prevBoundary.audioOffset;
    }

    const ratio = 
      (textOffset - prevBoundary.textOffset) / 
      (nextBoundary.textOffset - prevBoundary.textOffset);

    const result = prevBoundary.audioOffset + 
      ratio * (nextBoundary.audioOffset - prevBoundary.audioOffset);

    return result;
  }

  /**
   * Reset tracker state
   */
  reset(): void {
    this._currentTime = 0;
    this._startTime = 0;
    this._isPlaying = false;
  }

  /**
   * Get all bookmark names
   */
  getBookmarks(): string[] {
    return Array.from(this._bookmarkTimes.keys());
  }

  /**
   * Check if a bookmark exists
   */
  hasBookmark(mark: string): boolean {
    return this._bookmarkTimes.has(mark);
  }

  /**
   * Get bookmark time in seconds (absolute time from audio start)
   */
  getBookmarkTime(mark: string): number | undefined {
    return this._bookmarkTimes.get(mark);
  }

  // ============================================================================
  // 📍 DURATION APIs (Absolute Time Spans)
  // ============================================================================
  
  /**
   * Get duration from audio start to a bookmark
   * 
   * @param mark - The bookmark mark
   * @returns Duration in seconds from audio start to bookmark
   * 
   * @example
   * ```typescript
   * const tracker = ttsAudio().getTracker();
   * ttsAudio().play();
   * 
   * // Start animation at bookmark A
   * yield* delay(tracker.durationTo('A'), function*() {
   *   yield* circle().scale(1.5, 1.0);
   * }());
   * ```
   */
  durationTo(mark: string): number {
    const bookmarkTime = this._bookmarkTimes.get(mark);
    
    if (bookmarkTime === undefined) {
      const available = Array.from(this._bookmarkTimes.keys());
      if (available.length === 0) {
        throw new Error(`Bookmark '${mark}' not found. No bookmarks were loaded. This usually means TTS generation failed or the text contains no bookmarks.`);
      }
      throw new Error(`Bookmark '${mark}' not found. Available bookmarks: ${available.join(', ')}`);
    }

    return bookmarkTime;
  }

  /**
   * Get duration from a bookmark to audio end
   * 
   * @param mark - The bookmark mark
   * @returns Duration in seconds from bookmark to audio end
   * 
   * @example
   * ```typescript
   * // Animation from bookmark C to end
   * yield* tracker.startAt('C', function*() {
   *   yield* circle().size(300, tracker.durationFrom('C'));
   * });
   * ```
   */
  durationFrom(mark: string): number {
    const startTime = this.durationTo(mark);
    return this._duration - startTime;
  }

  /**
   * Get duration between two bookmarks
   * 
   * @param startMark - Starting bookmark
   * @param endMark - Ending bookmark
   * @returns Duration in seconds between the two bookmarks
   * 
   * @example
   * ```typescript
   * // Get duration from A to B
   * const durationAB = tracker.durationBetween('A', 'B');  // e.g., 1.7s
   * 
   * // Use with startAt() for timed animations
   * yield* tracker.startAt('A', function*() {
   *   yield* circle().size(300, tracker.durationBetween('A', 'B'));
   * });
   * ```
   */
  durationBetween(startMark: string, endMark: string): number {
    const startTime = this.durationTo(startMark);
    const endTime = this.durationTo(endMark);
    
    if (endTime <= startTime) {
      console.warn(`End bookmark '${endMark}' (${endTime}s) is before or at start bookmark '${startMark}' (${startTime}s)`);
      return 0;
    }

    return endTime - startTime;
  }

  // ============================================================================
  // 📍 BOOKMARK API (Relative Time)
  // ============================================================================

  /**
   * Get relative time to a bookmark (from current position).
   * - Positive: bookmark is in the future (time until it's reached)
   * - Negative: bookmark is in the past (time since it passed)
   * - Zero: bookmark is exactly at current position
   * 
   * @param mark - The bookmark mark to get relative time for
   * @returns Seconds to bookmark (positive = future, negative = past)
   * 
   * @example
   * ```typescript
   * const tracker = ttsAudio().getTracker();
   * ttsAudio().play();
   * 
   * // Animation will end when bookmark A is reached
   * const timeToA = tracker.bookmark('A');
   * if (timeToA > 0) {
   *   yield* circle().scale(1.2, timeToA);  // Ends at bookmark A
   * } else {
   *   console.log(`Bookmark A passed ${Math.abs(timeToA)}s ago`);
   * }
   * ```
   */
  bookmark(mark: string): number {
    const bookmarkTime = this.durationTo(mark);
    return bookmarkTime - this.elapsedTime;
  }

  // ============================================================================
  // 🎬 HIGH-LEVEL ANIMATION APIs (RECOMMENDED)
  // ============================================================================

  /**
   * Start animation at a specific bookmark
   * ✅ RECOMMENDED: Clear and intuitive API
   * 
   * @param mark - The bookmark where animation should start
   * @param block - Generator function containing the animations to run
   * @returns Generator that waits until bookmark then executes the block
   * 
   * @example
   * ```typescript
   * const tracker = ttsAudio().getTracker();
   * ttsAudio().play();
   * 
   * yield* all(
   *   // Circle grows from A to B
   *   tracker.startAt('A', function*() {
   *     yield* circle1().size(300, tracker.durationBetween('A', 'B'));
   *   }),
   *   
   *   // Rectangle fades from B to end
   *   tracker.startAt('B', function*() {
   *     yield* rect().opacity(1, tracker.durationFrom('B'));
   *   }),
   * );
   * ```
   */
  startAt(mark: string, block: () => Generator<any>): Generator<any> {
    const self = this;
    const task = function* () {
      const delayTime = self.durationTo(mark);
      if (delayTime > 0) {
        yield* waitFor(delayTime);
      }
      yield* block();
    };
    
    const generator = task();
    setTaskName(generator, mark);
    return generator;
  }

  /**
   * Execute animations and automatically wait for audio to finish
   * ✅ RECOMMENDED: Encapsulates common pattern
   * 
   * @param block - Generator function containing the animations to run
   * @returns Generator that executes animations then waits for audio to complete
   * 
   * @example
   * ```typescript
   * const tracker = ttsAudio().getTracker();
   * ttsAudio().play();
   * 
   * yield* tracker.playWith(function*() {
   *   yield* all(
   *     circle1().size(300, 2),
   *     circle2().opacity(1, 1.5),
   *   );
   * });
   * // ✅ Automatically waits for audio to finish!
   * ```
   */
  *playWith(block: () => Generator<any>): Generator<any> {
    yield* block();
    const remaining = this.remainingTime;
    if (remaining > 0) {
      yield* waitFor(remaining);
    }
  }

  /**
   * Execute multiple animations in parallel and automatically wait for audio to finish
   * ✅ RECOMMENDED: Cleaner than playWith + all
   * 
   * @param tasks - Variadic thread generators to run in parallel
   * @returns Generator that executes all animations then waits for audio to complete
   * 
   * @example
   * ```typescript
   * const tracker = ttsAudio().getTracker();
   * ttsAudio().play();
   * 
   * yield* tracker.playWithAll(
   *   circle1().size(300, 2),
   *   circle2().opacity(1, 1.5),
   *   tracker.startAt('A', function*() {
   *     yield* title().fill('#ff0000', 0.5);
   *   }),
   * );
   * // ✅ Runs all animations in parallel, then waits for audio!
   * ```
   */
  *playWithAll(...tasks: any[]): Generator<any> {
    yield* all(...tasks);
    const remaining = this.remainingTime;
    if (remaining > 0) {
      yield* waitFor(remaining);
    }
  }
}
