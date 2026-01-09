/**
 * TTS Provider types and interfaces
 */

export interface TTSConfig {
  voice?: string;
  style?: string;
  rate?: string;
  pitch?: string;
  volume?: string;
}

export interface TTSRequest {
  text: string;
  config?: TTSConfig;
  projectName?: string;
  fileName?: string; // Optional user-specified filename
  /** 
   * Suggested cache key for the audio file (e.g., "voice_abc12345")
   * Provider should use this as the filename to enable direct caching
   * Plugin generates this based on text + provider + config
   */
  cacheKey?: string;
}

export interface TTSResponse {
  success: boolean;
  duration?: number;
  wordBoundaries?: WordBoundary[];
  audioPath?: string;
  cached?: boolean;
  error?: string;
}

export interface WordBoundary {
  audioOffset: number;
  durationMs: number;
  textOffset: number;
  wordLength: number;
  text: string;
  boundaryType: 'word' | 'punctuation' | 'sentence';
}

/**
 * Base TTS Provider interface
 * 
 * Providers are responsible only for TTS generation.
 * Cache management (including key generation) is handled by the plugin.
 */
export interface TTSProvider {
  name: string;
  synthesize(request: TTSRequest): Promise<TTSResponse>;
}

/**
 * Azure TTS specific configuration
 */
export interface AzureTTSCredentials {
  subscriptionKey: string;
  region: string;
}

export interface AzureTTSConfig extends TTSConfig {
  voice?: string;
  style?: string;
}

/**
 * Plugin configuration
 */
export interface TTSPluginConfig {
  audioDir?: string;
  
  /**
   * Base URL for serving audio files
   * 
   * If not provided, will be auto-calculated from audioDir:
   * - "public/audio" -> "/audio"
   * - "public/media" -> "/media"
   * 
   * Set explicitly to use CDN or custom URLs:
   * - "https://cdn.example.com/audio"
   * - "https://storage.example.com/tts"
   */
  audioBaseUrl?: string;
  
  /**
   * TTS Provider to use
   * - Pass a TTSProvider instance for custom implementation
   * - Or specify provider type: 'azure' | 'openai' | 'google'
   */
  provider?: TTSProvider | 'azure' | 'openai' | 'google';
  
  defaultConfig?: TTSConfig;
  
  // Provider-specific configs
  azure?: AzureTTSCredentials & {
    defaultVoice?: string;
    defaultStyle?: string;
  };
  
  // Future providers
  // openai?: OpenAITTSCredentials & { defaultVoice?: string; };
  // google?: GoogleTTSCredentials & { defaultVoice?: string; };
}
