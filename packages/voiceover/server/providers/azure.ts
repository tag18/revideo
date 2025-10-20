import * as fs from 'fs';
import * as path from 'path';
import type {
  TTSProvider,
  TTSRequest,
  TTSResponse,
  TTSConfig,
  AzureTTSCredentials,
  WordBoundary,
} from '../types';

/**
 * Azure Cognitive Services TTS Provider
 */
export class AzureTTSProvider implements TTSProvider {
  name = 'azure';
  private credentials: AzureTTSCredentials;
  private audioDir: string;
  private audioBaseUrl: string;
  private defaultVoice: string;
  private defaultStyle?: string;

  constructor(
    credentials: AzureTTSCredentials,
    audioDir: string,
    audioBaseUrl: string,  // ⭐ Receive from plugin (supports CDN URLs)
    options?: {
      defaultVoice?: string;
      defaultStyle?: string;
    }
  ) {
    this.credentials = credentials;
    this.audioDir = audioDir;
    this.audioBaseUrl = audioBaseUrl;  // Store provided audioBaseUrl
    this.defaultVoice = options?.defaultVoice || 'en-US-AriaNeural';
    this.defaultStyle = options?.defaultStyle;
  }

  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    const {text, config, projectName, cacheKey} = request;

    // Merge with defaults
    const effectiveConfig: TTSConfig = {
      voice: config?.voice || this.defaultVoice,
      style: config?.style || this.defaultStyle,
      rate: config?.rate,
      pitch: config?.pitch,
      volume: config?.volume,
    };

    // Use cache key provided by plugin (includes text + provider + config hash)
    // This enables direct caching without file renaming
    if (!cacheKey) {
      throw new Error('Cache key is required for audio generation');
    }
    
    // Create project-specific directory
    const projectDir = projectName
      ? projectName.replace(/[^a-zA-Z0-9-_]/g, '_')
      : 'default';
    const projectAudioDir = path.join(this.audioDir, projectDir);

    if (!fs.existsSync(projectAudioDir)) {
      fs.mkdirSync(projectAudioDir, {recursive: true});
    }

    // Use cache key directly as filename (no renaming needed)
    const audioFilePath = path.join(projectAudioDir, `${cacheKey}.mp3`);

    // Generate TTS (caching is handled by plugin layer)
    console.log('Generating TTS audio for:', text.substring(0, 50) + '...');

    try {
      const sdk = await import('microsoft-cognitiveservices-speech-sdk');

      // Create speech config
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        this.credentials.subscriptionKey,
        this.credentials.region
      );
      speechConfig.speechSynthesisOutputFormat =
        sdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3;

      // Create synthesizer
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);

      // Generate SSML
      const ssml = this.generateSSML(text, effectiveConfig);

      // Track word boundaries
      const wordBoundaries: WordBoundary[] = [];

      synthesizer.wordBoundary = (sender: any, event: any) => {
        wordBoundaries.push({
          audioOffset: event.audioOffset / 10000,
          durationMs: event.duration / 10000,
          textOffset: event.textOffset,
          wordLength: event.wordLength,
          text: event.text,
          boundaryType: this.mapBoundaryType(event.boundaryType),
        });
      };

      // Perform synthesis
      const result = await new Promise<any>((resolve, reject) => {
        synthesizer.speakSsmlAsync(
          ssml,
          (result: any) => {
            synthesizer.close();
            if (!result) {
              reject(new Error('Azure SDK returned null result'));
              return;
            }
            resolve(result);
          },
          (error: any) => {
            synthesizer.close();
            reject(error);
          }
        );
      });

      // Check if synthesis was successful
      const actualReason = result.resultReason || (result as any).privReason;
      const audioData = result.audioData || (result as any).privAudioData;

      if (
        !result ||
        actualReason !== sdk.ResultReason.SynthesizingAudioCompleted
      ) {
        throw new Error(
          `Speech synthesis failed: ${result?.cancellationDetails?.errorDetails || 'Unknown error'}`
        );
      }

      // Save audio file
      fs.writeFileSync(audioFilePath, new Uint8Array(audioData));

      // Estimate duration
      const duration = this.estimateAudioDuration(audioData.byteLength);

      return {
        success: true,
        duration,
        wordBoundaries,
        audioPath: `${this.audioBaseUrl}/${projectDir}/${cacheKey}.mp3`,
      };
    } catch (error) {
      console.error('Azure TTS synthesis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private generateSSML(text: string, config: TTSConfig): string {
    let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">`;

    ssml += `<voice name="${config.voice}">`;

    const supportsStyle = config.voice?.includes('Neural') && config.style;
    if (supportsStyle) {
      ssml = ssml.replace(
        'xmlns="http://www.w3.org/2001/10/synthesis"',
        'xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts"'
      );
      ssml += `<mstts:express-as style="${config.style}">`;
    }

    if (config.rate || config.pitch || config.volume) {
      const prosodyAttrs = [];
      if (config.rate) prosodyAttrs.push(`rate="${config.rate}"`);
      if (config.pitch) prosodyAttrs.push(`pitch="${config.pitch}"`);
      if (config.volume) prosodyAttrs.push(`volume="${config.volume}"`);
      ssml += `<prosody ${prosodyAttrs.join(' ')}>`;
    }

    ssml += text;

    if (config.rate || config.pitch || config.volume) {
      ssml += `</prosody>`;
    }

    if (supportsStyle) {
      ssml += `</mstts:express-as>`;
    }

    ssml += `</voice></speak>`;

    return ssml;
  }

  private mapBoundaryType(
    type: number
  ): 'word' | 'punctuation' | 'sentence' {
    switch (type) {
      case 0:
        return 'word';
      case 1:
        return 'punctuation';
      case 2:
        return 'sentence';
      default:
        return 'word';
    }
  }

  private estimateAudioDuration(fileSize: number): number {
    const bitrate = 192000; // bits per second
    const bytesPerSecond = bitrate / 8;
    return fileSize / bytesPerSecond;
  }
}
