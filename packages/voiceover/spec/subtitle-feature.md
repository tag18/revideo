# Subtitle Feature Specification

## Overview
This specification outlines the design for adding subtitle (caption) functionality to the `voiceover` package. The goal is to provide a configurable, synchronized subtitle display that supports word-level highlighting (karaoke effect) and is designed to support both TTS-generated audio and future external audio sources.

## Requirements

1.  **Configurable Style**: Users can customize text style (font, size, color), background style, and shadows/outlines.
2.  **Configurable Position**: Users can set the position of the subtitles (e.g., bottom center, top).
3.  **Word Highlighting**: Support highlighting the current word based on playback timing. The highlight style must be configurable.
4.  **Long Text Handling**: Automatically segment long text into readable chunks (pages) to prevent overflow.
    *   Support limiting the number of lines per screen.
    *   Support limiting the maximum width or characters per line.
5.  **Segmentation Strategies**: Allow users to choose how text is split (e.g., by sentence, by character count, or filling the available space).
6.  **Future Audio Support**: The design must accommodate future integration with external audio files (non-TTS), decoupling the rendering from the audio generation source.
7.  **Toggle**: Subtitles can be enabled/disabled via configuration.

## API Design

### `Subtitle` Component

A new component `<Subtitle />` will be introduced in the `voiceover` package.

```typescript
interface SubtitleProps {
  /**
   * The audio source to synchronize with.
   * Can be a reference to a TTSAudio component or an object implementing the AudioSource interface.
   */
  source: () => AudioSource | null; // Accepts a ref function

  /**
   * Configuration for the subtitle appearance and behavior.
   */
  config?: SubtitleConfig;

  /**
   * Whether to show subtitles. Defaults to true.
   */
  enabled?: boolean;
}
```

### `SubtitleConfig` Interface

```typescript
interface SubtitleConfig {
  /**
   * Text styling options.
   */
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number | string;
    fill?: string; // Text color
    stroke?: string;
    strokeWidth?: number;
    textAlign?: 'left' | 'center' | 'right';
    lineHeight?: number;
    letterSpacing?: number;
    
    // Shadow / Outline for better visibility
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffset?: Vector2 | { x: number, y: number };

    // Background box styling
    backgroundColor?: string; // Background for the text container
    backgroundRadius?: number;
    padding?: number | { top: number, right: number, bottom: number, left: number };
  };

  /**
   * Style for the currently active word (Karaoke effect).
   */
  highlightStyle?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    fontWeight?: number | string;
    scale?: number; // Scale up the active word
    backgroundColor?: string; // Highlight background
  };

  /**
   * Layout and Positioning configuration.
   */
  layout?: {
    /**
     * Position of the subtitle container.
     * Defaults to bottom center (e.g., [0, 400]).
     */
    position?: Vector2 | { x: number, y: number };

    /**
     * Maximum width of the subtitle container in pixels.
     * Defaults to 80% of the view width.
     */
    maxWidth?: number;

    /**
     * Maximum number of lines to display at once.
     * Defaults to 2.
     */
    maxLines?: number;
  };

  /**
   * Strategy for splitting long text into subtitle pages.
   */
  segmentation?: {
    /**
     * How to split the text.
     * - 'sentence': Try to split at sentence boundaries (., ?, !).
     * - 'fill': Fill the lines up to maxLines/maxWidth, then break.
     * - 'manual': Respect newlines in the source text.
     */
    strategy?: 'sentence' | 'fill' | 'manual';
    
    /**
     * Preferred maximum characters per line (soft limit).
     * Used to guide the 'fill' strategy.
     */
    maxCharactersPerLine?: number;
  };
}
```

### `AudioSource` Interface (for Future Compatibility)

To support external audio, we define an interface that `TTSAudio` implements and future `ExternalAudio` components can implement.

```typescript
interface SubtitleBlock {
  startTime: number; // Seconds
  endTime: number;   // Seconds
  text: string;
}

interface AudioSource {
  /**
   * Current playback time in seconds.
   */
  currentTime: () => number;

  /**
   * Word alignment data (Optional).
   * Required for 'Karaoke' style word highlighting.
   */
  getWordBoundaries?: () => WordBoundary[];
  
  /**
   * Standard subtitle blocks (Optional).
   * Used if word boundaries are not available (e.g., from SRT/VTT files).
   */
  getSubtitles?: () => SubtitleBlock[];

  /**
   * The full text (optional, can be derived from boundaries).
   */
  getText: () => string;
}
```

## Implementation Details

### 1. Data Acquisition
The `Subtitle` component needs access to timing data. It supports two modes:
- **High Precision (TTS)**: Uses `getWordBoundaries()` to get per-word timing. Enables word highlighting.
- **Standard (SRT/VTT)**: Uses `getSubtitles()` to get block/sentence timing. Disables word highlighting.

### 2. Segmentation Logic (New)
Before rendering, the component must process the source data to create "Subtitle Pages".

**Scenario A: Using `WordBoundary[]` (TTS)**
1.  **Strategy 'fill'**: Iterate through words, measure width, and accumulate into lines/pages.
2.  **Strategy 'sentence'**: Split text by sentence terminators, map words to sentences.

**Scenario B: Using `SubtitleBlock[]` (SRT/VTT)**
1.  The segmentation is already defined by the blocks in the file.
2.  Each `SubtitleBlock` is treated as a "Page" (or part of a page if multiple blocks fit).
3.  **Note**: `segmentation` config options like `strategy` might be ignored or behave differently in this mode.

### 3. Synchronization Logic (Optimized for Seeking)
The `Subtitle` component uses a `useFrame` hook to synchronize with the audio. Since Revideo allows seeking to any frame, the logic must be stateless and efficient (O(1) or O(log n)).

**Critical**: The `currentTime` used must be the **logical scene time** (frame-perfect), not the `HTMLAudioElement.currentTime` (which may lag or be inaccurate during rendering).
- `TTSAudio` (and `Media` components) provide this via `getCurrentTime()` or the `time()` signal.
- The `Subtitle` component will read this value every frame.

1.  **Get Time**: `currentTime = source().currentTime()`.
2.  **Find Active Page (Binary Search)**: 
    *   Instead of iterating linearly, we use **Binary Search** on the pre-calculated "Subtitle Pages" array to find the page where `page.startTime <= currentTime <= page.endTime`.
    *   This ensures that jumping to minute 50 of a video is just as fast as playing from the start.
3.  **Find Active Word (Binary Search)**: 
    *   Similarly, within the active page, use binary search on the words to find the active one.
4.  **Render**: 
    *   Draw the active page's text.
    *   Apply `highlightStyle` to the active word.

**Seeking Behavior**:
- When the user seeks in the editor, the Scene time updates immediately.
- `TTSAudio.getCurrentTime()` returns the new time instantly (calculated from Scene time).
- `Subtitle`'s `useFrame` loop runs, gets the new time, and renders the correct subtitle frame immediately.
- No "fast-forwarding" or state synchronization is needed because the logic is purely functional: `f(time) -> subtitle_state`.

### 4. Rendering Optimization
- **Word Splitting**: To support word-level styling, the text will be rendered as a collection of individual `Txt` nodes (one for each word), laid out horizontally (with wrapping).
- **Caching**: The segmentation calculation should happen once (or when props change), not every frame.
- **Signals**: Use signals efficiently to update only the styles that change.

## Compatibility & Performance Analysis

### Compatibility with Revideo
This design is fully compatible with Revideo (and Motion Canvas) architecture.
- **Components**: It uses standard `Txt`, `Layout`, and `Rect` components.
- **Signals**: It leverages the signal system for reactive updates.
- **Hooks**: It uses `useFrame` (or `useScene().lifecycle.onUpdate`) which is the standard way to handle per-frame logic.

### Performance Considerations
Rendering individual `Txt` nodes for every word can be expensive if not optimized.
- **Optimization Strategy**:
    1.  **Page-based Rendering**: Only render the words for the *current page*. If a page has 20 words, we only render 20 nodes, not the hundreds in the full text.
    2.  **Signal Efficiency**: Instead of re-rendering the entire component tree every frame, we will use signals for the `fill` / `fontWeight` / `scale` properties of the words.
    3.  **Static Layout**: The layout (position of words) is calculated once per page. During playback, only the *style* of the active word changes.

### External Audio Support
Yes, the design explicitly supports external audio sources via the `AudioSource` interface.
- **Requirement**: You must provide a way to get `WordBoundary[]` (timestamps for each word).
- **Implementation**: You can create a helper function or component that parses a standard subtitle format (like SRT, VTT, or JSON) into `WordBoundary[]`.

```typescript
// Example: Parsing a JSON transcript
const externalSource = {
  currentTime: () => audioRef().currentTime(),
  getWordBoundaries: () => parseTranscript(jsonFile),
  getText: () => jsonFile.fullText
};
```

## Example Usage

```tsx
const ttsRef = createRef<TTSAudio>();

view.add(
  <>
    <TTSAudio 
      ref={ttsRef} 
      text="Hello world, this is a very long text that will be automatically split into multiple subtitle pages to ensure it fits on the screen comfortably." 
      play={true} 
    />
    
    <Subtitle 
      source={ttsRef}
      enabled={true}
      config={{
        style: {
          fontSize: 40,
          fill: 'white',
          stroke: 'black',
          strokeWidth: 2,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backgroundRadius: 8,
          padding: 10,
        },
        highlightStyle: {
          fill: 'yellow',
          fontWeight: 800,
        },
        layout: {
          position: { x: 0, y: 450 }, // Bottom
          maxLines: 2,
          maxWidth: 1600,
        },
        segmentation: {
          strategy: 'fill',
        }
      }}
    />
  </>
);
```
