import type {Plugin} from 'vite';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type {TTSPluginConfig, TTSProvider, TTSRequest, TTSConfig} from './types';
import {AzureTTSProvider} from './providers/azure';
import {FILENAME_SANITIZATION_REGEX} from './utils';

/**
 * Generate a cache key for the given text, config, and provider
 * Uses MD5 hash to create a short, unique identifier
 * 
 * IMPORTANT: Cache key MUST include provider name to avoid collisions
 * when different providers generate audio for the same text+config
 */
function generateCacheKey(text: string, provider: string, config?: TTSConfig): string {
  const input = JSON.stringify({
    text: text.trim(),
    provider,  // Critical: Different providers produce different audio
    config,
  });
  return `voice_${crypto.createHash('md5').update(input).digest('hex').substring(0, 8)}`;
}

/**
 * Vite plugin for TTS audio generation and caching
 * Provides server-side TTS synthesis with file-based caching
 * Supports multiple TTS providers (Azure, OpenAI, Google, etc.)
 * 
 * @param config - Plugin configuration
 * @param config.audioDir - Audio files output directory (default: 'public/audio')
 * @param config.provider - TTS provider ('azure' | 'openai' | 'google' or custom instance)
 * @param config.defaultConfig - Default TTS configuration (voice, rate, pitch, etc.)
 * @param config.azure - Azure TTS credentials (required if provider is 'azure')
 */
export function ttsPlugin(config: TTSPluginConfig = {}): Plugin {
  // Default: save audio files to public/audio (accessible via /audio/...)
  const audioDir =
    config.audioDir || path.join(process.cwd(), 'public', 'audio');

  // Calculate audioBaseUrl once - either use provided or auto-calculate
  // This supports both local paths (/audio) and CDN URLs (https://...)
  const audioBaseUrl = config.audioBaseUrl || (
    audioDir.startsWith('public/')
      ? `/${audioDir.replace(/^public\//, '')}`
      : `/${path.basename(audioDir)}`
  );

  console.log(`TTS Plugin: audioDir="${audioDir}", audioBaseUrl="${audioBaseUrl}"`);

  // Create provider instance
  let provider: TTSProvider;

  if (!config.provider) {
    // Fallback: Try to auto-detect from environment variables (Azure only for now)
    const subscriptionKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || 'eastus';

    if (!subscriptionKey) {
      throw new Error(
        'TTS provider not configured. Please provide either:\n' +
          '1. provider: "azure" (or "openai", "google") with credentials\n' +
          '2. provider: new CustomTTSProvider() for custom implementation\n' +
          '3. AZURE_SPEECH_KEY environment variable (auto-detects Azure)'
      );
    }

    console.log('Auto-detected Azure provider from environment variables');
    provider = new AzureTTSProvider(
      {subscriptionKey, region},
      audioDir,
      audioBaseUrl,  // Pass calculated audioBaseUrl
      {
        defaultVoice: config.defaultConfig?.voice || 'en-US-AriaNeural',
        defaultStyle: config.defaultConfig?.style,
      }
    );
  } else if (typeof config.provider === 'string') {
    // Provider type specified as string
    switch (config.provider) {
      case 'azure':
        if (!config.azure) {
          throw new Error(
            'provider is "azure" but config.azure is not provided'
          );
        }
        provider = new AzureTTSProvider(
          {
            subscriptionKey: config.azure.subscriptionKey,
            region: config.azure.region,
          },
          audioDir,
          audioBaseUrl,  // Pass calculated audioBaseUrl
          {
            defaultVoice:
              config.azure.defaultVoice || config.defaultConfig?.voice,
            defaultStyle:
              config.azure.defaultStyle || config.defaultConfig?.style,
          }
        );
        break;

      // Future providers
      // case 'openai':
      //   if (!config.openai) {
      //     throw new Error('provider is "openai" but config.openai is not provided');
      //   }
      //   provider = new OpenAITTSProvider(config.openai, audioDir);
      //   break;
      
      // case 'google':
      //   if (!config.google) {
      //     throw new Error('provider is "google" but config.google is not provided');
      //   }
      //   provider = new GoogleTTSProvider(config.google, audioDir);
      //   break;

      default:
        throw new Error(
          `Unknown provider: ${config.provider}. Supported: azure, openai, google`
        );
    }
  } else {
    // Custom provider instance
    provider = config.provider;
    console.log('Using custom TTS provider:', provider.name);
  }

  return {
    name: 'revideo-tts',

    configureServer(server) {
      // Ensure audio directory exists
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, {recursive: true});
      }

      console.log(
        `TTS Audio Cache Plugin initialized with provider: ${provider.name}`
      );

      server.middlewares.use('/api/tts', async (req, res) => {
        if (req.method === 'POST') {
          try {
            const chunks: any[] = [];

            req.on('data', chunk => {
              chunks.push(chunk);
            });

            req.on('end', async () => {
              const buffer = Buffer.concat(chunks as any);
              const bodyString = buffer.toString('utf8');

              try {
                const request: TTSRequest = JSON.parse(bodyString);

                // Merge default config with request config
                const mergedConfig = {
                  ...config.defaultConfig,
                  ...request.config,
                };

                // Generate cache key (includes provider name to avoid collisions)
                const cacheKey = generateCacheKey(request.text, provider.name, mergedConfig);

                const mergedRequest: TTSRequest = {
                  ...request,
                  config: mergedConfig,
                  cacheKey,  // Pass cache key to provider
                };
                
                // Create project-specific directory
                // Allow alphanumeric, Chinese characters, dashes, and underscores
                const projectDir = request.projectName
                  ? request.projectName.replace(FILENAME_SANITIZATION_REGEX, '_')
                  : 'default';
                const projectAudioDir = path.join(audioDir, projectDir);

                if (!fs.existsSync(projectAudioDir)) {
                  fs.mkdirSync(projectAudioDir, {recursive: true});
                }

                // Check cache first (plugin-level caching)
                const cachedAudioPath = path.join(projectAudioDir, `${cacheKey}.mp3`);
                const cachedMetadataPath = path.join(projectAudioDir, `${cacheKey}.json`);

                if (fs.existsSync(cachedAudioPath) && fs.existsSync(cachedMetadataPath)) {
                  try {
                    // Check if cached file is valid (not 0 bytes)
                    const stats = fs.statSync(cachedAudioPath);
                    if (stats.size === 0) {
                      console.warn('Found 0-byte cached file, deleting and regenerating:', cachedAudioPath);
                    } else {
                      const metadata = JSON.parse(fs.readFileSync(cachedMetadataPath, 'utf8'));
                      console.log('Using cached TTS result for:', cacheKey);

                      // Use pre-calculated audioBaseUrl (no repeated calculation)
                      const result = {
                        success: true,
                        duration: metadata.duration,
                        wordBoundaries: metadata.wordBoundaries,
                        audioPath: `${audioBaseUrl}/${projectDir}/${cacheKey}.mp3`,
                        cached: true,
                      };

                      res.writeHead(200, {'Content-Type': 'application/json'});
                      res.end(JSON.stringify(result));
                      return;
                    }
                  } catch (cacheError) {
                    console.warn('Failed to read cached metadata, regenerating:', cacheError);
                    // Continue to generate new TTS
                  }
                }

                // Cache miss - call provider to generate
                // Provider receives cacheKey and uses it directly as filename
                const result = await provider.synthesize(mergedRequest);
                
                if (!result.success) {
                  const errorMessage = result.error || 'TTS synthesis failed';
                  console.error('❌ TTS Generation Failed:', errorMessage);
                  
                  res.writeHead(500, {'Content-Type': 'application/json'});
                  res.end(JSON.stringify({ 
                    success: false, 
                    error: errorMessage 
                  }));
                  return;
                }

                // Provider should have saved file using the cacheKey
                // Verify the file exists and is not empty
                if (!fs.existsSync(cachedAudioPath)) {
                  console.error('❌ TTS Error: Provider claimed success but file not found:', cachedAudioPath);
                  res.writeHead(500, {'Content-Type': 'application/json'});
                  res.end(JSON.stringify({ 
                    success: false, 
                    error: 'Provider failed to save audio file with correct cache key' 
                  }));
                  return;
                }

                const stats = fs.statSync(cachedAudioPath);
                if (stats.size === 0) {
                  // Delete the empty file
                  fs.unlinkSync(cachedAudioPath);
                  
                  const errorMessage = 'TTS provider generated an empty (0-byte) audio file. Please check your API credentials and quota.';
                  console.error('❌ TTS Error:', errorMessage);
                  
                  res.writeHead(500, {'Content-Type': 'application/json'});
                  res.end(JSON.stringify({ 
                    success: false, 
                    error: errorMessage 
                  }));
                  return;
                }

                // Save metadata for cache
                const metadata = {
                  duration: result.duration,
                  wordBoundaries: result.wordBoundaries,
                  config: mergedConfig,
                  timestamp: Date.now(),
                };
                fs.writeFileSync(cachedMetadataPath, JSON.stringify(metadata, null, 2));

                // Return result (audioPath should already be correct from provider)
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(result));
              } catch (parseError) {
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(
                  JSON.stringify({
                    success: false,
                    error:
                      parseError instanceof Error
                        ? parseError.message
                        : 'Invalid request data',
                  })
                );
              }
            });
          } catch (error) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(
              JSON.stringify({
                success: false,
                error:
                  error instanceof Error ? error.message : 'Unknown error',
              })
            );
          }
        } else {
          res.writeHead(405, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: 'Method not allowed'}));
        }
      });
    },
  };
}
