/**
 * Word boundary information from TTS provider
 * Used for bookmark timing calculation
 */
export interface WordBoundary {
  /** Audio offset in milliseconds */
  audioOffset: number;
  /** Duration of the word in milliseconds */
  durationMs: number;
  /** Text offset (character position in original text) */
  textOffset: number;
  /** Length of the word */
  wordLength: number;
  /** The actual word text */
  text: string;
  /** Type of boundary */
  boundaryType: 'word' | 'punctuation' | 'sentence';
}
