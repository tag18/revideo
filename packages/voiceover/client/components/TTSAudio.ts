import {Audio} from '@revideo/2d';
import type {MediaProps} from '@revideo/2d/lib/components/Media';
import {DependencyContext, type SimpleSignal, type SignalValue, useScene} from '@revideo/core';
import {waitFor} from '@revideo/core/lib/flow';
import {computed, initial, signal} from '@revideo/2d/lib/decorators';
import {VoiceoverTracker} from './VoiceoverTracker';
import type {WordBoundary} from '../types';

export interface TTSAudioProps extends Omit<MediaProps, 'src'> {
  text: SignalValue<string>;
  voice?: SignalValue<string>;
  rate?: SignalValue<string>;
  pitch?: SignalValue<string>;
}

/**
 * Project-level TTS default configuration
 * Used in makeProject's variables.ttsDefaults
 */
export interface ProjectTTSDefaults {
  voice?: string;
  rate?: string;
  pitch?: string;
  style?: string;
  role?: string;
  volume?: string;
  projectName?: string;
}

/**
 * TTSAudio component that combines TTS generation with audio playback
 * Acts like a regular Audio component but generates speech from text using TTS
 */
export class TTSAudio extends Audio {
  private static readonly ttsGenerationPromises: Record<string, Promise<{audioPath: string; wordBoundaries: WordBoundary[]; duration: number}>> = {};
  private static readonly ttsTrackerCache: Record<string, VoiceoverTracker> = {};
  
  // Voiceover tracker for duration and bookmark management
  private _tracker: VoiceoverTracker = new VoiceoverTracker();
  
  // ⚠️ CRITICAL FIX: Override mediaElement to return cachedAudioNode directly
  // The @computed() decorator on Audio.audio() causes it to return the parent's 
  // pooled audio element instead of our override, so we bypass audio() entirely
  protected override mediaElement(): HTMLAudioElement {
    // Ensure cachedAudioNode exists
    if (!this.cachedAudioNode) {
      // First call during construction - create placeholder
      if (this.isConstructing) {
        this.cachedAudioNode = document.createElement('audio');
        this.cachedAudioNode.crossOrigin = 'anonymous';
      } else {
        // Create with TTS
        this.cachedAudioNode = this.createAudioWithTTS();
      }
    }
    
    return this.cachedAudioNode;
  }
  
  // Create a 1-second silent audio as placeholder (avoids NaN duration)
  private static createSilentAudio(): string {
    // Create a short silent audio data URL (44100Hz, 1 second, mono)
    const sampleRate = 44100;
    const duration = 1; // 1 second placeholder
    const numChannels = 1;
    const numSamples = sampleRate * duration;
    
    // WAV file header
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    // RIFF chunk descriptor
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + numSamples * 2, true); // file size - 8
    view.setUint32(8, 0x57415645, false); // "WAVE"
    
    // fmt sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // subchunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, numChannels, true); // num channels
    view.setUint32(24, sampleRate, true); // sample rate
    view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
    view.setUint16(32, numChannels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    
    // data sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, numSamples * 2, true); // data size
    
    // Create silent data (all zeros)
    const samples = new Int16Array(numSamples);
    
    // Merge header and data
    const wavData = new Uint8Array(header.byteLength + samples.byteLength);
    wavData.set(new Uint8Array(header), 0);
    wavData.set(new Uint8Array(samples.buffer), header.byteLength);
    
    // Create Blob and URL
    const blob = new Blob([wavData], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  private static silentAudioUrl: string | null = null;
  
  // Store original props (needed before constructor)
  private _ttsText?: SignalValue<string>;
  private _ttsVoice?: SignalValue<string>;
  private _ttsRate?: SignalValue<string>;
  private _ttsPitch?: SignalValue<string>;
  private _projectName: string = 'default';

  private static formatRateAndPitch(value: string | undefined): string {
    // Handle undefined or null values
    if (!value) {
      return '0%';
    }
    
    // Convert common values to Azure TTS format
    switch (value.toLowerCase()) {
      case 'slow':
        return '-20%';
      case 'medium':
      case 'normal':
        return '0%';
      case 'fast':
        return '+20%';
      default:
        // If already in percentage format or other format, use as-is
        return value;
    }
  }

  private static async generateTTSStatic(text: string, voice: string, rate: string, pitch: string, projectName: string): Promise<{audioPath: string; wordBoundaries: WordBoundary[]; duration: number}> {
    // Validate inputs
    if (!text || typeof text !== 'string') {
      throw new Error(`Invalid text parameter: ${text}`);
    }
    if (!voice || typeof voice !== 'string') {
      throw new Error(`Invalid voice parameter: ${voice}`);
    }
    
    // Convert rate and pitch to proper format
    console.log('🎤 TTS Input params:', { text, voice, rate, pitch, projectName });
    const rateFormatted = TTSAudio.formatRateAndPitch(rate);
    const pitchFormatted = TTSAudio.formatRateAndPitch(pitch);
    
    const requestBody = {
      text: text.trim(), // Ensure no extra whitespace
      config: {
        voice: voice,
        rate: rateFormatted,
        pitch: pitchFormatted,
      },
      projectName: projectName,
    };
    
    console.log('🎤 TTS Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🚨 TTS API Error Response:', errorText);
      throw new Error(`TTS request failed: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('🔗 TTSAudio generated audioPath:', result.audioPath);
    console.log('📍 Word boundaries received:', result.wordBoundaries?.length || 0);
    
    if (!result.success || !result.audioPath) {
      throw new Error(`TTS generation failed: ${result.error || 'Unknown error'}`);
    }
    
    return {
      audioPath: result.audioPath,
      wordBoundaries: result.wordBoundaries || [],
      duration: result.duration || 0
    };
  }

  private cachedAudioNode?: HTMLAudioElement;
  private currentTtsKey?: string;
  private currentGenerationPromise?: Promise<string>;
  private isConstructing = true; // Flag to mark if still in construction

  public constructor(props: TTSAudioProps) {
    // Extract TTS props
    const {text, voice, rate, pitch, ...audioProps} = props;
    
    super({src: undefined, ...audioProps}); // src: undefined, avoid loading invalid src
    
    // Try to get project-level TTS defaults from variables
    let projectDefaults: ProjectTTSDefaults = {};
    let sceneName = 'default';
    try {
      const scene = useScene();
      sceneName = scene.name;
      // variables.get() returns a function, need to call it
      const getTTSDefaults = scene.variables.get<ProjectTTSDefaults>('ttsDefaults', {});
      projectDefaults = getTTSDefaults();
    } catch (e) {
      // Scene not available during construction, ignore
    }
    
    // Merge: project defaults < component props
    // Component props take precedence over project defaults
    this._ttsText = text;
    this._ttsVoice = voice ?? projectDefaults.voice ?? 'en-US-AriaNeural';
    this._ttsRate = rate ?? projectDefaults.rate ?? 'medium';
    this._ttsPitch = pitch ?? projectDefaults.pitch ?? 'medium';
    // Use configured projectName, or fallback to scene name
    this._projectName = projectDefaults.projectName ?? sceneName;
    this.isConstructing = false;
    
    // After construction, if a placeholder was created during construction, reinitialize
    if (this.cachedAudioNode && this._ttsText) {
      console.log('🔄 TTSAudio: Constructor complete, reinitializing audio...');
      
      // Clear placeholder and recreate
      const placeholder = this.cachedAudioNode;
      this.cachedAudioNode = undefined; // Reset cache
      
      // Immediately create new audio and trigger TTS
      const newAudio = this.createAudioWithTTS();
      
      // Copy properties like volume (inherited from placeholder)
      if (placeholder.volume !== undefined) {
        newAudio.volume = placeholder.volume;
      }
      
      this.cachedAudioNode = newAudio;
    }
  }
  
  // Extract TTS initialization logic to separate method
  private createAudioWithTTS(): HTMLAudioElement {
    const audioNode = document.createElement('audio');
    audioNode.crossOrigin = 'anonymous';
    // ⚠️ Don't use Object.assign(audioNode, this.audioProps)
    // Media properties (like volume) are managed through signals, no need to directly assign to DOM
    
    // Evaluate TTS parameters
    const textValue = this.evaluateSignal(this._ttsText);
    const voiceValue = this.evaluateSignal(this._ttsVoice);
    const rateValue = this.evaluateSignal(this._ttsRate);
    const pitchValue = this.evaluateSignal(this._ttsPitch);
    
    // Validate parameters
    if (textValue && typeof textValue === 'string') {
      // Start TTS generation immediately
      const ttsKey = `${textValue}/${voiceValue}/${rateValue}/${pitchValue}`;
      this.currentTtsKey = ttsKey;
      
      console.log('🎤 TTSAudio: Starting TTS generation...');
      console.log('🎤 TTS params:', { text: textValue, voice: voiceValue, rate: rateValue, pitch: pitchValue });
      
      // Start or get existing TTS generation Promise
      if (!TTSAudio.ttsGenerationPromises[ttsKey]) {
        TTSAudio.ttsGenerationPromises[ttsKey] = TTSAudio.generateTTSStatic(
          textValue,
          voiceValue,
          rateValue,
          pitchValue,
          this._projectName
        );
      }
      
      // Create complete Promise chain
      this.currentGenerationPromise = TTSAudio.ttsGenerationPromises[ttsKey]
        .then(result => {
          if (!this.cachedAudioNode || this.currentTtsKey !== ttsKey) {
            return result.audioPath;
          }
          
          console.log('✅ TTSAudio: TTS generated, setting src:', result.audioPath);
          console.log('📍 Word boundaries:', result.wordBoundaries.length);
          
          // Update tracker with duration and word boundaries
          this._tracker.setDuration(result.duration);
          this._tracker.setWordBoundaries(result.wordBoundaries);
          this._tracker.processBookmarks(textValue);
          
          // Cache tracker for reuse
          TTSAudio.ttsTrackerCache[ttsKey] = this._tracker;
          
          // ⚠️ Critical: Update Media's src signal, not just the DOM's src
          this.src(result.audioPath);
          
          this.cachedAudioNode.src = result.audioPath;
          this.cachedAudioNode.load();
          
          console.log('🔍 DEBUG: After setting src, signal value:', this.src());
          
          // Wait for canplay event
          return new Promise<string>((resolve) => {
            this.cachedAudioNode!.addEventListener('canplay', () => {
              console.log('✅ TTSAudio: Ready to play, duration:', this.cachedAudioNode!.duration);
              console.log('🔍 DEBUG: cachedAudioNode:', this.cachedAudioNode);
              console.log('🔍 DEBUG: cachedAudioNode.src:', this.cachedAudioNode!.src);
              console.log('🔍 DEBUG: cachedAudioNode.readyState:', this.cachedAudioNode!.readyState);
              resolve(result.audioPath);
            }, { once: true });
          });
        })
        .catch(error => {
          console.error('❌ TTSAudio: TTS generation failed:', error);
          // On failure, set silent audio
          if (this.cachedAudioNode) {
            if (!TTSAudio.silentAudioUrl) {
              TTSAudio.silentAudioUrl = TTSAudio.createSilentAudio();
            }
            this.cachedAudioNode.src = TTSAudio.silentAudioUrl;
          }
          throw error;
        });
      
      // Collect Promise
      DependencyContext.collectPromise(this.currentGenerationPromise);
      
    } else {
      // No valid text, use silent placeholder
      console.warn('⚠️ TTSAudio: No valid text provided, using silent audio');
      if (!TTSAudio.silentAudioUrl) {
        TTSAudio.silentAudioUrl = TTSAudio.createSilentAudio();
      }
      audioNode.src = TTSAudio.silentAudioUrl;
    }
    
    return audioNode;
  }

  // Helper method to evaluate a SignalValue
  private evaluateSignal<T>(value: SignalValue<T> | undefined): T {
    if (value === undefined) return '' as any;
    return typeof value === 'function' ? (value as any)() : value;
  }

  // Override the audio() method to handle TTS generation
  protected override audio(): HTMLAudioElement {
    // First call: create audio element
    if (!this.cachedAudioNode) {
      // If still constructing, return temporary placeholder
      if (this.isConstructing) {
        console.log('⚠️ TTSAudio: Still constructing, returning empty audio node');
        this.cachedAudioNode = document.createElement('audio');
        this.cachedAudioNode.crossOrigin = 'anonymous';
        return this.cachedAudioNode;
      }
      
      // Construction complete, create real audio and trigger TTS
      this.cachedAudioNode = this.createAudioWithTTS();
      return this.cachedAudioNode;
    }
    
    console.log('🔍 DEBUG audio(): Returning cached audio node, duration:', this.cachedAudioNode.duration);
    console.log('🔍 DEBUG audio(): src:', this.cachedAudioNode.src);
    
    // Subsequent calls: check for parameter changes
    if (!this._ttsText) {
      return this.cachedAudioNode;
    }
    
    const textValue = this.evaluateSignal(this._ttsText);
    const voiceValue = this.evaluateSignal(this._ttsVoice);
    const rateValue = this.evaluateSignal(this._ttsRate);
    const pitchValue = this.evaluateSignal(this._ttsPitch);

    // Validate parameters
    if (!textValue || typeof textValue !== 'string') {
      return this.cachedAudioNode;
    }

    const ttsKey = `${textValue}/${voiceValue}/${rateValue}/${pitchValue}`;

    // If key is the same, return directly
    if (this.currentTtsKey === ttsKey) {
      return this.cachedAudioNode;
    }

    // Key changed, need to regenerate
    console.log('🔄 TTSAudio: Parameters changed, regenerating TTS...');
    this.currentTtsKey = ttsKey;

    // Start new TTS generation
    if (!TTSAudio.ttsGenerationPromises[ttsKey]) {
      TTSAudio.ttsGenerationPromises[ttsKey] = TTSAudio.generateTTSStatic(
        textValue,
        voiceValue,
        rateValue,
        pitchValue,
        this._projectName
      );
    }

    // Create Promise chain
    this.currentGenerationPromise = TTSAudio.ttsGenerationPromises[ttsKey]
      .then(result => {
        if (!this.cachedAudioNode || this.currentTtsKey !== ttsKey) {
          return result.audioPath;
        }
        
        console.log('🔄 TTSAudio: Parameter changed, setting new src:', result.audioPath);
        
        // Update tracker
        this._tracker.setDuration(result.duration);
        this._tracker.setWordBoundaries(result.wordBoundaries);
        this._tracker.processBookmarks(textValue);
        
        // ⚠️ Critical: Update Media's src signal
        this.src(result.audioPath);
        
        this.cachedAudioNode.src = result.audioPath;
        this.cachedAudioNode.load();
        
        return new Promise<string>((resolve, reject) => {
          const canPlayHandler = () => {
            console.log('✅ TTSAudio: Regenerated audio ready');
            this.cachedAudioNode?.removeEventListener('canplay', canPlayHandler);
            this.cachedAudioNode?.removeEventListener('error', errorHandler);
            resolve(result.audioPath);
          };
          
          const errorHandler = (e: Event) => {
            this.cachedAudioNode?.removeEventListener('canplay', canPlayHandler);
            this.cachedAudioNode?.removeEventListener('error', errorHandler);
            reject(new Error('Audio load failed'));
          };
          
          if (this.cachedAudioNode && this.cachedAudioNode.readyState >= 2) {
            resolve(result.audioPath);
          } else {
            this.cachedAudioNode?.addEventListener('canplay', canPlayHandler);
            this.cachedAudioNode?.addEventListener('error', errorHandler);
          }
        });
      })
      .catch(error => {
        console.error('🚨 TTSAudio: Regeneration failed:', error);
        throw error;
      });
    
    // Collect Promise
    DependencyContext.collectPromise(this.currentGenerationPromise);

    return this.cachedAudioNode;
  }

  /**
   * Wait for TTS audio generation to complete
   * Can be used in scene with yield ttsAudio.waitForGeneration() to explicitly wait
   * 
   * @returns Promise<string> - Path to the generated audio file
   * 
   * @example
   * ```typescript
   * const ttsAudio = <TTSAudio text="Hello" voice="..." />;
   * view.add(ttsAudio);
   * 
   * // Explicitly wait for TTS generation to complete
   * const audioPath = yield ttsAudio.waitForGeneration();
   * console.log('TTS generated:', audioPath);
   * 
   * // Now safe to play
   * ttsAudio.play();
   * ```
   */
  public async waitForGeneration(): Promise<string> {
    // Trigger an audio() call to ensure TTS generation has started
    this.audio();
    
    // If there's an ongoing generation task, wait for it
    if (this.currentGenerationPromise) {
      return await this.currentGenerationPromise;
    }
    
    // If no generation task, it's already complete or using silent audio
    return this.cachedAudioNode?.src || '';
  }

  /**
   * Get current TTS generation status
   * @returns 'idle' | 'generating' | 'ready'
   */
  public generationStatus(): 'idle' | 'generating' | 'ready' {
    if (!this.currentTtsKey) {
      return 'idle';
    }
    
    const ttsKey = this.currentTtsKey;
    const promise = TTSAudio.ttsGenerationPromises[ttsKey];
    
    if (!promise) {
      return 'idle';
    }
    
    // Check if promise is resolved by checking if audio src is set
    if (this.cachedAudioNode && 
        this.cachedAudioNode.src !== TTSAudio.silentAudioUrl &&
        this.cachedAudioNode.src !== '') {
      return 'ready';
    }
    
    return 'generating';
  }

  /**
   * Override play() to automatically set tracker start time
   */
  public override play() {
    // Set start time on tracker when play is called
    if (this._tracker) {
      this._tracker.setStartTime(this.time());
    }
    super.play();
  }

  /**
   * Get voiceover tracker for duration and bookmark control
   * Inspired by Manim-Voiceover's tracker system
   * 
   * @returns VoiceoverTracker instance
   * 
   * @example
   * ```typescript
   * const ttsAudio = <TTSAudio 
   *   text="Hello <bookmark mark='A'/> world <bookmark mark='B'/> everyone"
   * />;
   * 
   * // Get tracker for duration control
   * const tracker = ttsAudio.getTracker();
   * 
   * // Use in animations
   * yield* ttsAudio.play();
   * yield* waitFor(tracker.timeUntilBookmark('A'));
   * // Trigger animation at bookmark A
   * ```
   */
  public getTracker(): VoiceoverTracker {
    // Set time getter if not already set
    if (!this._tracker['_timeGetter']) {
      this._tracker.setTimeGetter(() => this.time());
    }
    return this._tracker;
  }

  /**
   * Play audio and ensure it completes when the block finishes
   * This mimics Manim-Voiceover's context manager pattern
   * 
   * Equivalent to Manim-Voiceover's:
   * ```python
   * with self.voiceover(text="...") as tracker:
   *     self.play(Circle().animate.scale(2), run_time=tracker.duration)
   * # Audio finishes exactly when this block ends
   * ```
   * 
   * @returns Generator that yields tracker and waits for remaining audio at the end
   * 
   * @example
   * ```typescript
   * // Method 1: Automatic synchronization
   * yield* ttsAudio().playUntilDone(function*(tracker) {
   *   // Any animations here
   *   yield* circle().size(300, 1.5);  // Takes 1.5s
   *   yield* rect().fill('#ff0000', 1.0);  // Takes 1.0s
   *   // After all animations (2.5s), waits for remaining audio time
   * });
   * 
   * // Method 2: Manual duration matching
   * const tracker = ttsAudio().getTracker();
   * yield* all(
   *   ttsAudio().play(),
   *   circle().size(300, tracker.duration)  // Matches audio duration exactly
   * );
   * ```
   */
  public *playUntilDone(animationBlock?: (tracker: VoiceoverTracker) => Generator<any>) {
    const tracker = this.getTracker();
    const startTime = this.time();
    
    // Set start time on tracker for elapsedTime/remainingTime calculations
    tracker.setStartTime(startTime);
    
    // Start playing audio
    this.play();
    
    if (animationBlock) {
      // Execute the animation block
      yield* animationBlock(tracker);
      
      // Use tracker's remainingTime for consistency
      const remaining = tracker.remainingTime;
      
      if (remaining > 0) {
        yield* waitFor(remaining);
      }
    } else {
      // No animation block, just wait for full duration
      yield* waitFor(tracker.duration);
    }
  }

  /**
   * Play audio until a specific bookmark is reached
   * 
   * @param mark - The bookmark mark to play until
   * @returns Generator that plays audio and waits until bookmark
   * 
   * @example
   * ```typescript
   * // Play audio until bookmark 'A', then start animation
   * yield* ttsAudio().playUntilBookmark('A');
   * yield* circle().scale(1.5, 0.5);  // Animation starts at bookmark A
   * ```
   */
  public *playUntilBookmark(mark: string) {
    const tracker = this.getTracker();
    const startTime = this.time();
    tracker.setStartTime(startTime);
    
    // Start playing audio
    this.play();
    
    // Wait until bookmark
    const timeUntil = tracker.bookmark(mark);
    if (timeUntil > 0) {
      yield* waitFor(timeUntil);
    }
  }

  /**
   * Wait for a specific bookmark to be reached (audio should already be playing)
   * 
   * @param mark - The bookmark mark to wait for
   * @returns Generator that waits until bookmark
   * 
   * @example
   * ```typescript
   * // Start playing audio
   * ttsAudio().play();
   * const tracker = ttsAudio().getTracker();
   * tracker.setStartTime(this.time());
   * 
   * // Wait for bookmark A, then trigger animation
   * yield* ttsAudio().waitForBookmark('A');
   * yield* circle1().scale(1.2, 0.5);
   * 
   * // Wait for bookmark B, then trigger another animation
   * yield* ttsAudio().waitForBookmark('B');
   * yield* circle2().scale(1.2, 0.5);
   * ```
   */
  public *waitForBookmark(mark: string) {
    const tracker = this.getTracker();
    const timeUntil = tracker.bookmark(mark);
    if (timeUntil > 0) {
      yield* waitFor(timeUntil);
    }
  }

  // AudioSource implementation
  public currentTime(): number {
    return this.getCurrentTime();
  }

  public getWordBoundaries(): WordBoundary[] {
    return this.getTracker().getWordBoundaries();
  }

  public getText(): string {
    return this.evaluateSignal(this._ttsText) || '';
  }
}