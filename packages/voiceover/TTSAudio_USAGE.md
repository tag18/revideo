# TTSAudio Component Usage Guide

`TTSAudio` is a powerful component that combines Text-to-Speech (TTS) generation with audio playback. It automatically handles audio generation, caching, and synchronization with animations.

## 🚀 Basic Usage

Import `TTSAudio` and use it in your scene. It behaves like a standard `Audio` component but takes `text` instead of `src`.

```tsx
import {TTSAudio} from '@revideo/voiceover';

// ... inside your scene generator
const tts = createRef<TTSAudio>();

yield view.add(
  <TTSAudio
    ref={tts}
    text="Hello, welcome to Revideo!"
    voice="en-US-AriaNeural" // Optional: Override default voice
    rate="medium"            // Optional: 'slow' | 'medium' | 'fast' | '+10%'
    pitch="medium"           // Optional: 'low' | 'medium' | 'high' | '+5Hz'
    play={false}             // Don't auto-play on mount
  />
);

// Play audio
tts().play();
```

## 📁 Automatic File Organization

`TTSAudio` automatically organizes generated audio files based on your project structure.

### 1. Automatic Mode (Recommended)
By default, audio files are stored in a directory matching your **Scene Name**.

```tsx
// Scene: "Chapter 1"
// Audio will be saved to: public/audio/Chapter 1/
export default makeScene2D('Chapter 1', function* (view) {
  // ...
});
```

### 2. Manual Configuration
You can force a specific directory name using project variables.

```tsx
// project.tsx
export default makeProject({
  // ...
  variables: {
    ttsDefaults: {
      projectName: 'my-custom-folder', // Force all audio to this folder
    }
  }
});
```

## ⚙️ Project-Level Defaults

Set default TTS settings in your `makeProject` configuration to avoid repeating props.

```tsx
// project.tsx
export default makeProject({
  scenes: [scene],
  variables: {
    ttsDefaults: {
      voice: 'zh-CN-XiaoxiaoNeural',
      rate: 'medium',
      pitch: 'medium',
      // projectName: 'custom-folder', // Optional
    },
  },
});
```

## ⏱️ VoiceoverTracker & Synchronization

`TTSAudio` includes a built-in `VoiceoverTracker` for precise animation synchronization.

### Using Bookmarks (SSML)

Insert bookmarks in your text to trigger animations at specific points.

```tsx
const text = "First step <bookmark mark='A'/>, second step <bookmark mark='B'/>.";

yield view.add(<TTSAudio ref={tts} text={text} />);
const tracker = tts().getTracker();

tts().play();

// Wait for bookmark 'A'
yield* waitFor(tracker.bookmark('A'));
yield* circle().scale(2, 0.5);

// Wait for bookmark 'B'
yield* waitFor(tracker.bookmark('B'));
yield* rect().fill('red', 0.5);
```

### Helper Methods

#### `playUntilDone(callback)`
Plays audio and runs animations in parallel, ensuring the block finishes exactly when audio ends.

```tsx
yield* tts().playUntilDone(function* (tracker) {
  // These animations run while audio plays
  yield* circle().fadeIn(1);
  yield* waitFor(tracker.bookmark('A'));
  yield* text().text("Step A");
});
// Execution continues here only after audio finishes
```

#### `playUntilBookmark(mark)`
Plays audio and waits until a specific bookmark is reached.

```tsx
yield* tts().playUntilBookmark('A');
// Audio continues playing in background, but code execution resumes here
yield* showImage();
```

## 📝 Subtitle Integration

`TTSAudio` works seamlessly with the `Subtitle` component to display synchronized captions.

```tsx
import {Subtitle} from '@revideo/voiceover';

// ...
yield view.add(
  <>
    <TTSAudio ref={tts} text="..." />
    
    <Subtitle
      source={() => tts()} // Link to TTSAudio source
      config={{
        style: { fontSize: 40, fill: 'white' },
        highlightStyle: { fill: 'yellow' } // Karaoke effect
      }}
    />
  </>
);
```

## �🔍 Debugging

You can check the status of TTS generation:

```tsx
console.log(tts().generationStatus()); // 'idle' | 'generating' | 'ready'

// Explicitly wait for generation if needed
await tts().waitForGeneration();
```
