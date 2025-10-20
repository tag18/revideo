/**
 * Type declarations for microsoft-cognitiveservices-speech-sdk
 * 
 * This package does not provide TypeScript definitions (@types/microsoft-cognitiveservices-speech-sdk doesn't exist),
 * so we manually declare the types we use to enable TypeScript compilation and provide basic IntelliSense.
 * 
 * These declarations cover only the subset of the SDK API that we actually use in azure.ts.
 * 
 * @see https://www.npmjs.com/package/microsoft-cognitiveservices-speech-sdk
 */
declare module 'microsoft-cognitiveservices-speech-sdk' {
  export class SpeechConfig {
    static fromSubscription(subscriptionKey: string, region: string): SpeechConfig;
    speechSynthesisOutputFormat: SpeechSynthesisOutputFormat;
  }

  export class SpeechSynthesizer {
    constructor(config: SpeechConfig, audioConfig: any);
    speakSsmlAsync(
      ssml: string,
      callback: (result: any) => void,
      errorCallback: (error: any) => void
    ): void;
    close(): void;
    wordBoundary: ((sender: any, event: any) => void) | null;
  }

  export enum SpeechSynthesisOutputFormat {
    Audio48Khz192KBitRateMonoMp3 = 17,
  }

  export enum ResultReason {
    SynthesizingAudioCompleted = 3,
  }
}
