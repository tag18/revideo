# @revideo/voiceover

Text-to-speech integration for Revideo animations with smart caching and multi-provider support.

## 🎯 Overview

`@revideo/voiceover` provides seamless text-to-speech capabilities for Revideo projects. It consists of two packages:

- **Client** - `TTSAudio` component for browser-side usage
- **Server** - Vite plugin for TTS generation and caching

## 🚀 Quick Start

### 1. Install

```bash
npm install @revideo/voiceover
```

### 2. Configure Server Plugin

```typescript
// vite.config.ts
import {defineConfig} from 'vite';
import {ttsPlugin} from '@revideo/voiceover/server';

export default defineConfig({
  plugins: [
    ttsPlugin({
      provider: 'azure',
      azure: {
        subscriptionKey: process.env.AZURE_SPEECH_KEY!,
        region: process.env.AZURE_SPEECH_REGION || 'eastus',
        defaultVoice: 'en-US-JennyNeural',
      },
    }),
  ],
});
```

**Environment Variables (.env.local):**
```bash
AZURE_SPEECH_KEY=your_subscription_key
AZURE_SPEECH_REGION=eastus
```

### 3. Use TTSAudio Component

```tsx
import {makeScene2D} from '@revideo/2d';
import {TTSAudio} from '@revideo/voiceover/client';
import {waitFor} from '@revideo/core';

export default makeScene2D(function* (view) {
  const audio = (
    <TTSAudio 
      text="Hello, this is text-to-speech"
      voice="en-US-JennyNeural"
      rate="medium"
      play={false}
    />
  );
  
  yield view.add(audio);
  yield* audio.play();
  yield* waitFor(audio.getDuration());
});
```

## 📦 Package Structure

```
@revideo/voiceover/
├── client/              # Browser-side components
│   ├── components/
│   │   └── TTSAudio.ts
│   └── index.ts
│
└── server/              # Node.js TTS generation
    ├── tts-plugin.ts
    ├── types.ts
    └── providers/
        └── azure.ts
```

## 🎨 Key Features

### ✅ Smart Caching
- Content-based hash for deduplication
- Avoids regenerating identical audio
- Fast playback for repeated content

### ✅ Project-Level Defaults
Set TTS defaults once, use everywhere:

```typescript
// project.ts
export default makeProject({
  scenes: [...],
  variables: {
    ttsDefaults: {
      voice: 'en-US-GuyNeural',
      rate: 'medium',
    },
  },
});

// scene.tsx - automatically uses defaults
<TTSAudio text="Hello" play={false} />
```

### ✅ Multi-Provider Architecture
- Currently supports Azure Cognitive Services
- Extensible to OpenAI, Google, and custom providers
- Simple provider interface

### ✅ TypeScript Support
Full type safety with IntelliSense support.

## 📖 Documentation

- [Client Package](./client/README.md) - TTSAudio component usage
- [Server Package](./server/README.md) - Plugin configuration and providers
- [Project Variables Guide](./docs/PROJECT_VARIABLES.md) - Setting project defaults
- [Configuration Guide](./docs/PROJECT_DEFAULTS_SOLUTION.md) - Complete configuration reference

## 🔧 Advanced Usage

### Custom Provider

Implement the `TTSProvider` interface:

```typescript
import type {TTSProvider, TTSRequest, TTSResponse} from '@revideo/voiceover/server';

class CustomProvider implements TTSProvider {
  name = 'custom';
  
  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    // Your TTS implementation
  }
  
  generateCacheKey(text: string, config?: any): string {
    // Generate unique cache key
  }
}
```

Use it in the plugin:

```typescript
ttsPlugin({
  provider: new CustomProvider(/* ... */),
})
```

## 🎯 Configuration Options

### TTSAudio Props

```typescript
interface TTSAudioProps {
  text: string;              // Text to convert
  voice?: string;            // Voice name
  rate?: string;             // 'slow' | 'medium' | 'fast'
  pitch?: string;            // 'low' | 'medium' | 'high'
  // + all Audio component props
}
```

### Project Defaults

```typescript
interface ProjectTTSDefaults {
  voice?: string;
  rate?: string;
  pitch?: string;
  style?: string;            // Voice style (provider-dependent)
  role?: string;             // Role play (provider-dependent)
  volume?: string;
}
```

## 🌐 Supported TTS Providers

### Azure Cognitive Services
- **Status:** ✅ Fully supported
- **Features:** SSML, voice styles, word boundaries
- **Setup:** Requires Azure Speech subscription

### Future Providers
- OpenAI TTS (planned)
- Google Cloud TTS (planned)
- ElevenLabs (planned)

## 🔐 Security Best Practices

- ✅ Store credentials in environment variables
- ✅ Never commit API keys to version control
- ✅ Use `.env.local` for local development
- ✅ Configure proper environment variables in production

## 📊 Performance

- **Caching:** Identical text generates audio once
- **File-based:** Cached audio persists across restarts
- **Async:** Non-blocking generation with Promise handling
- **Streaming-ready:** Design supports future streaming implementations

## 🤝 Contributing

Contributions welcome! Areas of interest:
- New TTS provider implementations
- Performance optimizations
- Documentation improvements
- Bug fixes

## 📄 License

MIT

## 🔗 Links

- [Azure Speech Service](https://azure.microsoft.com/en-us/services/cognitive-services/speech-services/)
