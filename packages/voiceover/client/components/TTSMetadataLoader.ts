import type {WordBoundary} from '../types';

/**
 * TTS Audio Metadata structure
 * Matches the server-side metadata JSON files
 */
export interface TTSMetadata {
  /** Audio duration in seconds */
  duration: number;
  
  /** Word boundaries for bookmark timing */
  wordBoundaries: WordBoundary[];
  
  /** TTS configuration used */
  config: {
    voice: string;
    rate?: string;
    pitch?: string;
    style?: string;
    role?: string;
    volume?: string;
  };
  
  /** Timestamp when audio was generated */
  timestamp: number;
}

/**
 * Utility to fetch TTS metadata from server
 * Useful for preloading or debugging
 */
export class TTSMetadataLoader {
  /**
   * Load metadata for a given audio path
   * @param audioPath - Path to the audio file (e.g., '/audio/project/voice_xxx.mp3')
   * @returns Metadata or null if not found
   */
  static async loadMetadata(audioPath: string): Promise<TTSMetadata | null> {
    try {
      // Convert audio path to metadata path
      // /audio/project/voice_xxx.mp3 -> /audio/project/voice_xxx.json
      const metadataPath = audioPath.replace(/\.mp3$/, '.json');
      
      const response = await fetch(metadataPath);
      
      if (!response.ok) {
        console.warn(`Metadata not found for ${audioPath}`);
        return null;
      }
      
      const metadata: TTSMetadata = await response.json();
      return metadata;
    } catch (error) {
      console.error('Failed to load TTS metadata:', error);
      return null;
    }
  }

  /**
   * Preload metadata for multiple audio files
   * @param audioPaths - Array of audio file paths
   * @returns Map of audioPath -> metadata
   */
  static async preloadMetadata(audioPaths: string[]): Promise<Map<string, TTSMetadata>> {
    const metadataMap = new Map<string, TTSMetadata>();
    
    const results = await Promise.allSettled(
      audioPaths.map(async (path) => {
        const metadata = await this.loadMetadata(path);
        if (metadata) {
          metadataMap.set(path, metadata);
        }
      })
    );
    
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) {
      console.warn(`Failed to load ${failed} metadata files`);
    }
    
    return metadataMap;
  }

  /**
   * Get bookmark times from metadata
   * @param metadata - TTS metadata
   * @param text - Original text with bookmarks
   * @returns Map of bookmark name -> time in seconds
   */
  static extractBookmarks(metadata: TTSMetadata, text: string): Map<string, number> {
    const bookmarkTimes = new Map<string, number>();
    
    // Parse bookmarks from text
    const bookmarkRegex = /<bookmark\s+mark\s*=\s*['"](\w+)['"]\s*\/>/g;
    let content = '';
    let lastIndex = 0;
    let match;

    while ((match = bookmarkRegex.exec(text)) !== null) {
      const mark = match[1];
      const bookmarkPosition = match.index;
      
      content += text.substring(lastIndex, bookmarkPosition);
      const textOffset = content.length;
      
      // Interpolate audio offset from word boundaries
      const audioOffset = this.interpolateAudioOffset(textOffset, metadata.wordBoundaries);
      bookmarkTimes.set(mark, audioOffset / 1000); // Convert to seconds
      
      lastIndex = match.index + match[0].length;
    }
    
    return bookmarkTimes;
  }

  /**
   * Interpolate audio offset from text offset using word boundaries
   */
  private static interpolateAudioOffset(textOffset: number, wordBoundaries: WordBoundary[]): number {
    if (wordBoundaries.length === 0) {
      return 0;
    }

    let prevBoundary = wordBoundaries[0];
    let nextBoundary = wordBoundaries[wordBoundaries.length - 1];

    for (let i = 0; i < wordBoundaries.length - 1; i++) {
      const curr = wordBoundaries[i];
      const next = wordBoundaries[i + 1];

      if (textOffset >= curr.textOffset && textOffset <= next.textOffset) {
        prevBoundary = curr;
        nextBoundary = next;
        break;
      }
    }

    if (prevBoundary.textOffset === nextBoundary.textOffset) {
      return prevBoundary.audioOffset;
    }

    const ratio = 
      (textOffset - prevBoundary.textOffset) / 
      (nextBoundary.textOffset - prevBoundary.textOffset);

    return prevBoundary.audioOffset + 
      ratio * (nextBoundary.audioOffset - prevBoundary.audioOffset);
  }
}
