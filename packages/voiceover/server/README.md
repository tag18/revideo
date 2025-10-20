# TTS Plugin - Server Package

## 📦 Package Structure

```
server/
├── index.ts                 # Export entry point
├── tts-plugin.ts           # Vite plugin main logic
├── types.ts                # Type definitions
└── providers/              # TTS Provider implementations
    └── azure.ts            # Azure Cognitive Services TTS
```

## 🎯 Design Principles

### 1. Clean API Naming
- ✅ `ttsPlugin()` - Instead of `ttsAudioCachePlugin()`
- Reason: Caching is an internal implementation detail that shouldn't be exposed in the API naming

### 2. Flexible Provider Configuration
- ✅ `provider: 'azure'` - String-based configuration
- ✅ `provider: new CustomProvider()` - Custom instance injection
- Reason: Single field supports both approaches, providing simplicity and power

### 3. No Legacy Compatibility Burden
- ✅ This is a fresh design, maintaining only the latest API
- ✅ File naming directly reflects functionality: `tts-plugin.ts`
- Reason: New project without historical baggage keeps the code clean

## 🚀 Quick Start

### Installation

```bash
npm install @revideo/voiceover
```

### Configuration

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
        defaultStyle: 'cheerful',
      },
      
      defaultConfig: {
        rate: 'medium',
        pitch: 'medium',
      },
    }),
  ],
});
```

**Environment Variables:**
```bash
# .env.local
AZURE_SPEECH_KEY=your_subscription_key_here
AZURE_SPEECH_REGION=eastus
```

## 📝 Exports

```typescript
// Main API
export {ttsPlugin} from './tts-plugin';

// Type definitions
export type {
  TTSPluginConfig,
  TTSProvider,
  TTSRequest,
  TTSResponse,
  TTSConfig,
  AzureTTSCredentials,
  WordBoundary,
} from './types';

// Provider implementations
export {AzureTTSProvider} from './providers/azure';
```

## 🔧 Extending with Custom Providers

### Implement the Interface

```typescript
import type {TTSProvider, TTSRequest, TTSResponse, TTSConfig} from '@revideo/voiceover/server';

export class CustomTTSProvider implements TTSProvider {
  name = 'custom';
  
  constructor(
    private credentials: {apiKey: string},
    private audioDir: string,
  ) {}
  
  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    // Call your TTS API
    // Save audio file to disk
    // Return response with audio path and metadata
  }
  
  generateCacheKey(text: string, config?: TTSConfig): string {
    // Generate unique cache key based on content
  }
}
```

### Use Custom Provider

```typescript
// Option 1: String-based (requires adding to types.ts)
ttsPlugin({
  provider: 'custom',
  custom: {
    apiKey: process.env.CUSTOM_API_KEY!,
  },
})

// Option 2: Direct instance injection
import {CustomTTSProvider} from './providers/custom';

ttsPlugin({
  provider: new CustomTTSProvider(
    {apiKey: process.env.CUSTOM_API_KEY!},
    './public/audio'
  ),
})
```

## 🎨 Implementation Highlights

### 1. Provider Pattern
- Unified `TTSProvider` interface for consistency
- Supports both string-based config and instance injection
- Easy to extend with new TTS services

### 2. File-Based Caching
- Content-based hash for cache key generation
- Avoids regenerating identical content
- Stores audio files with metadata (duration, word boundaries)

### 3. Vite Integration
- Middleware providing `/api/tts` endpoint
- Automatic static file serving for generated audio
- Consistent behavior in development and production

## 📊 Workflow

```
1. Client sends POST /api/tts
   ↓
2. Plugin checks cache
   ↓
3a. Cache hit → Return audio path immediately
   ↓
3b. Cache miss → Provider.synthesize()
   ↓
4. Save audio file + metadata to disk
   ↓
5. Return audio path to client
```

## ✨ Features

- ✅ Multi-provider support (Azure currently, extensible to OpenAI, Google, etc.)
- ✅ Smart caching (content hash-based deduplication)
- ✅ SSML support (voice styles, speech rate, pitch control)
- ✅ Word boundaries (for subtitle synchronization)
- ✅ Environment variable configuration (secure credential management)
- ✅ TypeScript type safety
- ✅ Clean, minimal API design

## 📖 Related Documentation

- [Server Configuration Guide](./SERVER_CONFIGURATION.md)
- [Client Package Documentation](../client/README.md)
