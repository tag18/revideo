# TTS Audio - Client Package

## 📦 Package Structure

```
client/
├── index.ts                      # Export entry point
├── components/
│   └── TTSAudio.ts              # TTSAudio component
└── types.ts                     # Type definitions (if any)
```

## 🎯 Overview

The client package provides the `TTSAudio` component for Revideo, which combines text-to-speech generation with audio playback. It acts like a regular `Audio` component but automatically generates speech from text using the TTS server plugin.

## 🚀 Quick Start

### Installation

```bash
npm install @revideo/voiceover
```

### Basic Usage

```tsx
import {makeScene2D} from '@revideo/2d';
import {TTSAudio} from '@revideo/voiceover/client';
import {waitFor} from '@revideo/core';

export default makeScene2D(function* (view) {
  const audio = (
    <TTSAudio 
      text="Hello, this is a text-to-speech audio component"
      voice="en-US-JennyNeural"
      rate="medium"
      pitch="medium"
      play={false}
      volume={0.8}
    />
  );
  
  // Add component and wait for TTS generation
  yield view.add(audio);
  
  // Play the generated audio
  yield* audio.play();
  yield* waitFor(audio.getDuration());
});
```

## 📝 Component Props

```typescript
interface TTSAudioProps extends Omit<MediaProps, 'src'> {
  text: SignalValue<string>;      // Text to convert to speech
  voice?: SignalValue<string>;    // Voice name (e.g., 'en-US-JennyNeural')
  rate?: SignalValue<string>;     // Speech rate: 'slow' | 'medium' | 'fast' | '-50%' ~ '+200%'
  pitch?: SignalValue<string>;    // Pitch: 'low' | 'medium' | 'high' | '-50%' ~ '+50%'
}
```

All other props from the base `Audio` component are supported (volume, play, etc.).

## 🎨 Project-Level Defaults

You can set project-wide TTS defaults using Project Variables:

```typescript
import {makeProject} from '@revideo/core';
import type {ProjectTTSDefaults} from '@revideo/voiceover/client';

const ttsDefaults: ProjectTTSDefaults = {
  voice: 'en-US-GuyNeural',
  rate: 'slow',
  pitch: 'medium',
};

export default makeProject({
  scenes: [...],
  
  // Set project-level TTS defaults
  variables: {
    ttsDefaults,
  },
});
```

Now all `TTSAudio` components will use these defaults unless overridden:

```tsx
// Uses project defaults
<TTSAudio text="Hello" play={false} />

// Override single property
<TTSAudio 
  text="Hello" 
  voice="en-US-JennyNeural"  // Override voice, rate still 'slow'
  play={false} 
/>
```

**Configuration Priority:** Component props > Project variables > Hardcoded defaults

## 🔧 Advanced Usage

### Wait for Generation Explicitly

```tsx
const audio = <TTSAudio text="Hello" />;
yield view.add(audio);

// Explicitly wait for TTS generation
const audioPath = yield audio.waitForGeneration();
console.log('TTS generated:', audioPath);

// Now safe to play
yield* audio.play();
```

### Check Generation Status

```tsx
const audio = <TTSAudio text="Hello" />;

// Check status
const status = audio.generationStatus(); // 'idle' | 'generating' | 'ready'

if (status === 'ready') {
  yield* audio.play();
}
```

## 📊 How It Works

```
1. Component created with text
   ↓
2. Constructor evaluates props and reads project defaults
   ↓
3. On view.add(), sends POST /api/tts to server
   ↓
4. Server generates audio (or returns cached)
   ↓
5. Audio src set automatically, ready to play
```

## 🎯 Key Features

- ✅ **Automatic TTS generation** - No manual API calls needed
- ✅ **Smart caching** - Identical text reuses cached audio
- ✅ **Project-level defaults** - DRY configuration using Project Variables
- ✅ **Flexible overrides** - Component props take precedence
- ✅ **Async handling** - Integrates with Revideo's generator-based flow
- ✅ **Type-safe** - Full TypeScript support

## 📖 Type Exports

```typescript
// Component
export {TTSAudio} from './components/TTSAudio';

// Props interface
export type {TTSAudioProps} from './components/TTSAudio';

// Project defaults interface
export type {ProjectTTSDefaults} from './components/TTSAudio';
```

## 🔗 Related Documentation

- [Azure TTS Voice List](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts)
