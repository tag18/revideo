import {Layout, Txt, Rect, LayoutProps, TxtProps} from '@revideo/2d';
import {SignalValue, SimpleSignal, useScene, createRef, Reference, Vector2, PossibleVector2} from '@revideo/core';
import {computed, initial, signal, nodeName} from '@revideo/2d/lib/decorators';
import {WordBoundary} from '../types';

export interface SubtitleBlock {
  startTime: number; // Seconds
  endTime: number;   // Seconds
  text: string;
}

export interface AudioSource {
  currentTime: () => number;
  getWordBoundaries?: () => WordBoundary[];
  getSubtitles?: () => SubtitleBlock[];
  getText: () => string;
}

export interface SubtitleConfig {
  style?: TxtProps & {
    backgroundColor?: string;
    backgroundRadius?: number;
    padding?: number | { top: number, right: number, bottom: number, left: number };
    wordSpacing?: number;
  };
  highlightStyle?: Partial<TxtProps> & {
    scale?: number;
    backgroundColor?: string;
  };
  layout?: {
    position?: PossibleVector2;
    maxWidth?: number;
    maxLines?: number;
  };
  segmentation?: {
    strategy?: 'sentence' | 'fill' | 'manual';
    maxCharactersPerLine?: number;
  };
}

export interface SubtitleProps extends LayoutProps {
  source: SignalValue<AudioSource | null>;
  config?: SignalValue<SubtitleConfig>;
  enabled?: SignalValue<boolean>;
}

interface SubtitlePage {
  startTime: number;
  endTime: number;
  words: WordBoundary[];
  lines: WordBoundary[][]; // Words grouped by line
}

class SubtitleTxt extends Txt {
  public wordBoundary?: WordBoundary;
}

@nodeName('Subtitle')
export class Subtitle extends Layout {
  @initial(null)
  @signal()
  public declare readonly source: SimpleSignal<AudioSource | null, this>;

  @initial({
    style: {
      fontSize: 40,
      fill: 'white',
      textAlign: 'center',
    },
    highlightStyle: {
      fill: 'yellow',
    },
    layout: {
      maxLines: 2,
    },
    segmentation: {
      strategy: 'fill',
    }
  })
  @signal()
  public declare readonly config: SimpleSignal<SubtitleConfig, this>;

  @initial(true)
  @signal()
  public declare readonly enabled: SimpleSignal<boolean, this>;

  private container: Rect;
  private pages: SubtitlePage[] = [];
  private lastSourceText: string = '';
  private lastPageIndex: number = -1;
  
  private unsubscribe: () => void;

  public constructor(props: SubtitleProps) {
    super(props);
    
    this.container = new Rect({
      layout: true,
      direction: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0, // Start hidden
    });
    this.add(this.container);

    // Hook into the update loop
    this.unsubscribe = useScene().lifecycleEvents.onBeginRender.subscribe(this.onUpdate.bind(this));
  }

  public override dispose() {
    this.unsubscribe();
    super.dispose();
  }

  private onUpdate() {
    if (!this.enabled()) {
      this.container.removeChildren();
      this.container.opacity(0);
      return;
    }

    const source = this.source();
    if (!source) {
      this.container.opacity(0);
      return;
    }

    // Check if we need to re-segment
    const currentText = source.getText();
    if (currentText !== this.lastSourceText) {
      this.segmentText(source);
      this.lastSourceText = currentText;
    }

    if (this.pages.length === 0) {
      this.container.opacity(0);
      return;
    }

    const currentTime = source.currentTime();
    
    // Find active page (Binary Search)
    const pageIndex = this.findActivePage(currentTime);
    
    if (pageIndex !== -1) {
      this.container.opacity(1);
      const page = this.pages[pageIndex];
      
      // If page changed, re-render layout
      if (pageIndex !== this.lastPageIndex) {
        this.renderPage(page, this.config());
        this.lastPageIndex = pageIndex;
      }

      // Update highlights
      this.updateHighlights(page, currentTime, this.config());
    } else {
      // No active page
      if (this.lastPageIndex !== -1 || this.container.opacity() !== 0) {
        this.container.removeChildren();
        this.container.opacity(0);
        this.lastPageIndex = -1;
      }
    }
  }

  private findActivePage(time: number): number {
    let left = 0;
    let right = this.pages.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const page = this.pages[mid];
      
      if (time >= page.startTime && time <= page.endTime) {
        return mid;
      }
      
      if (time < page.startTime) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    
    return -1;
  }

  private segmentText(source: AudioSource) {
    const rawBoundaries = source.getWordBoundaries ? source.getWordBoundaries() : [];
    
    // Define punctuation patterns
    // Opening punctuation should merge with the NEXT word
    const isOpeningPunct = (text: string) => /^["'「『（《\[\(]$/.test(text.trim());
    // Closing punctuation should merge with the PREVIOUS word  
    const isClosingPunct = (text: string) => /^[.,:;!?，。：；！？、"'」』）》\]\)]$/.test(text.trim());
    
    // First pass: clean up whitespace and split words that contain both punctuation and text
    const cleanedBoundaries: WordBoundary[] = [];
    
    for (const word of rawBoundaries) {
      // Clean up: remove newlines and extra spaces, trim
      let cleanText = word.text.replace(/[\r\n]+/g, '').replace(/\s+/g, ' ').trim();
      
      if (!cleanText) continue;
      
      // Check if this word contains mixed content (e.g., '"这' or '"\n    这')
      // Split into separate parts if needed
      const parts: string[] = [];
      let currentPart = '';
      
      for (const char of cleanText) {
        const isOpenChar = /["'「『（《\[\(]/.test(char);
        const isCloseChar = /["'」』）》\]\).,:;!?，。：；！？、]/.test(char);
        
        if (isOpenChar || isCloseChar) {
          if (currentPart) {
            parts.push(currentPart);
            currentPart = '';
          }
          parts.push(char);
        } else {
          currentPart += char;
        }
      }
      if (currentPart) {
        parts.push(currentPart);
      }
      
      // Create word boundaries for each part
      // For simplicity, distribute the duration evenly (not perfect but better than broken display)
      const durationPerPart = word.durationMs / parts.length;
      let offset = word.audioOffset;
      
      for (const part of parts) {
        if (part.trim()) {
          cleanedBoundaries.push({
            ...word,
            text: part.trim(),
            audioOffset: offset,
            durationMs: durationPerPart,
          });
        }
        offset += durationPerPart;
      }
    }
    
    // Second pass: merge punctuation into adjacent words
    const boundaries: WordBoundary[] = [];
    let pendingOpenQuote: WordBoundary | null = null;
    
    for (let i = 0; i < cleanedBoundaries.length; i++) {
      const word = cleanedBoundaries[i];
      const text = word.text.trim();
      
      // Check if this is opening punctuation
      if (isOpeningPunct(text)) {
        // Save to merge with next word
        pendingOpenQuote = {...word};
        continue;
      }
      
      // Check if this is closing punctuation
      if (isClosingPunct(text)) {
        // Merge with previous word
        if (boundaries.length > 0) {
          const lastWord = boundaries[boundaries.length - 1];
          lastWord.text += word.text;
          // Extend duration to include punctuation
          const newEndTime = word.audioOffset + word.durationMs;
          lastWord.durationMs = newEndTime - lastWord.audioOffset;
          continue;
        }
      }
      
      // Regular word
      const newWord = {...word};
      
      // If there's a pending opening quote, prepend it
      if (pendingOpenQuote) {
        newWord.text = pendingOpenQuote.text + newWord.text;
        // Use the opening quote's start time
        newWord.audioOffset = pendingOpenQuote.audioOffset;
        newWord.durationMs = (word.audioOffset + word.durationMs) - pendingOpenQuote.audioOffset;
        pendingOpenQuote = null;
      }
      
      boundaries.push(newWord);
    }

    const config = this.config();
    const maxLines = config.layout?.maxLines ?? 2;
    const maxWidth = config.layout?.maxWidth ?? 1600; // Default max width
    
    // Simple segmentation logic (fill strategy)
    // Note: Real width measurement requires canvas context, here we approximate or assume monospaced for simplicity
    // or we can just use character count if width is not available easily without rendering.
    // For now, let's use a simple character count heuristic or just word count if maxWidth is not strictly enforced by pixels.
    
    // Better approach: Use a hidden Txt node to measure? Too slow.
    // Let's assume average char width for now or just use maxCharactersPerLine.
    const maxChars = config.segmentation?.maxCharactersPerLine ?? 40;
    
    this.pages = [];
    
    if (boundaries.length === 0) return;

    let currentPage: SubtitlePage = {
      startTime: boundaries[0].audioOffset / 1000,
      endTime: 0,
      words: [],
      lines: []
    };
    
    let currentLine: WordBoundary[] = [];
    let currentLineLength = 0;
    
    for (const word of boundaries) {
      // Check if adding this word exceeds line length
      if (currentLineLength + word.text.length > maxChars) {
        // Push current line
        currentPage.lines.push(currentLine);
        currentLine = [];
        currentLineLength = 0;
        
        // Check if page is full
        if (currentPage.lines.length >= maxLines) {
          // Finish current page
          const lastWord = currentPage.words[currentPage.words.length - 1];
          currentPage.endTime = (lastWord.audioOffset + lastWord.durationMs) / 1000;
          this.pages.push(currentPage);
          
          // Start new page
          currentPage = {
            startTime: word.audioOffset / 1000,
            endTime: 0,
            words: [],
            lines: []
          };
        }
      }
      
      currentLine.push(word);
      currentPage.words.push(word);
      currentLineLength += word.text.length + 1; // +1 for space
    }
    
    // Push remaining
    if (currentLine.length > 0) {
      currentPage.lines.push(currentLine);
    }
    if (currentPage.words.length > 0) {
      const lastWord = currentPage.words[currentPage.words.length - 1];
      currentPage.endTime = (lastWord.audioOffset + lastWord.durationMs) / 1000;
      this.pages.push(currentPage);
    }
  }

  private renderPage(page: SubtitlePage, config: SubtitleConfig) {
    this.container.removeChildren();
    
    // Apply container style (background, padding)
    const fullStyle = config.style || {};
    const {
      backgroundColor,
      backgroundRadius,
      padding,
      wordSpacing: _wordSpacing,
      ...textStyle
    } = fullStyle;

    const layout = config.layout || {};
    const wordSpacing = _wordSpacing ?? 10;
    
    this.container.position(layout.position || [0, 400]);
    
    // Apply container visual styles
    if (backgroundColor) this.container.fill(backgroundColor);
    if (backgroundRadius) this.container.radius(backgroundRadius);
    if (padding !== undefined) this.container.padding(padding);
    
    // Render lines
    for (const line of page.lines) {
      const lineContainer = new Layout({
        layout: true,
        direction: 'row',
        alignItems: 'end',  // Use 'end' for consistent bottom alignment (baseline-like behavior)
        justifyContent: 'center',
      });
      
      for (let i = 0; i < line.length; i++) {
        const word = line[i];
        const prevWord = i > 0 ? line[i-1] : null;
        
        let marginLeft = 0;
        if (prevWord) {
          if (this.shouldAddSpace(prevWord.text, word.text)) {
            marginLeft = wordSpacing;
          }
        }

        const txt = new SubtitleTxt({
          text: word.text,
          marginLeft: marginLeft,
          strokeFirst: true,
          ...textStyle,
        });
        // Store reference to word boundary for highlighting
        txt.wordBoundary = word;
        lineContainer.add(txt);
      }
      
      this.container.add(lineContainer);
    }
  }

  private shouldAddSpace(prev: string, curr: string): boolean {
    // If current starts with closing punctuation, no space
    if (/^[.,:;!?，。：；！？"'」』）》\]\)]/.test(curr)) return false;
    
    // If previous ends with opening punctuation, no space
    if (/["'「『（《\[\(]$/.test(prev)) return false;
    
    // If current starts with opening quote (merged with word), check the actual first char
    const currFirstChar = curr.charAt(0);
    if (/["'「『（《\[\(]/.test(currFirstChar)) return false;
    
    // If both are CJK, no space
    const isPrevCJK = /[\u4e00-\u9fa5]/.test(prev);
    const isCurrCJK = /[\u4e00-\u9fa5]/.test(curr);
    
    if (isPrevCJK && isCurrCJK) return false;
    
    // Default to space
    return true;
  }

  private updateHighlights(page: SubtitlePage, time: number, config: SubtitleConfig) {
    const highlightStyle = config.highlightStyle || {};
    const normalStyle = config.style || {};
    
    // Iterate through all Txt nodes in the container
    this.container.children().forEach(lineNode => {
      if (lineNode instanceof Layout) {
        lineNode.children().forEach(wordNode => {
          if (wordNode instanceof SubtitleTxt) {
            const word = wordNode.wordBoundary;
            if (!word) return;

            const startTime = word.audioOffset / 1000;
            const endTime = (word.audioOffset + word.durationMs) / 1000;
            
            if (time >= startTime && time < endTime) {
              // Active word
              if (highlightStyle.fill) wordNode.fill(highlightStyle.fill);
              if (highlightStyle.scale) wordNode.scale(highlightStyle.scale);
              if (highlightStyle.fontWeight) wordNode.fontWeight(highlightStyle.fontWeight as number);
            } else {
              // Normal word
              wordNode.fill(normalStyle.fill || 'white');
              wordNode.scale(1);
              wordNode.fontWeight(normalStyle.fontWeight as number || 400);
            }
          }
        });
      }
    });
  }
}
