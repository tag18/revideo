import type {SignalValue, SimpleSignal} from '@revideo/core';
import {BBox, useThread, useLogger} from '@revideo/core';
import type {AnimationItem, LottiePlayer} from 'lottie-web';
import {computed, initial, nodeName, signal} from '../decorators';
import type {RectProps} from './Rect';
import {Rect} from './Rect';

export interface LottieProps extends RectProps {
  src?: SignalValue<string>;
  loop?: SignalValue<boolean>;
  autoplay?: SignalValue<boolean>;
  speed?: SignalValue<number>;
}

interface LottieInstance {
  animation: AnimationItem;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
}

@nodeName('Lottie')
export class Lottie extends Rect {
  @signal()
  public declare readonly src: SimpleSignal<string, this>;

  @initial(true)
  @signal()
  public declare readonly loop: SimpleSignal<boolean, this>;

  @initial(true)
  @signal()
  public declare readonly autoplay: SimpleSignal<boolean, this>;

  @initial(1)
  @signal()
  public declare readonly speed: SimpleSignal<number, this>;

  @initial(0)
  @signal()
  protected declare readonly time: SimpleSignal<number, this>;

  protected currentTime: number = 0;
  protected lastTime: number = 0;
  private lottieLib: LottiePlayer | null = null;

  public constructor(props: LottieProps) {
    super(props);

    const time = useThread().time;
    const start = time();
    this.time(() => time() - start);
  }

  @computed()
  private async lottie(): Promise<LottieInstance> {
    if (!this.lottieLib) {
      // Dynamically import lottie-web
      const lottieModule = await import('lottie-web');
      this.lottieLib = lottieModule.default;
    }

    const src = this.src();
    
    if (!src) {
      throw new Error('Lottie src is required');
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = this.width();
    canvas.height = this.height();
    const context = canvas.getContext('2d')!;

    // Load animation data
    const animationData = await this.loadAnimationData(src);

    // Create Lottie animation instance - using canvas renderer
    const animation = this.lottieLib!.loadAnimation({
      renderer: 'canvas',
      loop: false, // We manually control looping
      autoplay: false, // We manually control playback
      animationData: animationData,
      rendererSettings: {
        context: context, // Directly pass canvas context
        clearCanvas: true,
        progressiveLoad: false,
        hideOnTransparent: true,
      },
    });

    // Set playback speed
    animation.setSpeed(this.speed());

    return {animation, canvas, context};
  }

  private async loadAnimationData(src: string): Promise<any> {
    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to load Lottie file: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      const logger = useLogger();
      logger.error(`Error loading Lottie animation: ${error}`);
      throw error;
    }
  }

  protected override async draw(context: CanvasRenderingContext2D) {
    // Only draw shape when there's background color or border
    if (this.fill() !== null || (this.lineWidth() > 0 && this.stroke() !== null)) {
      this.drawShape(context);
    }

    this.currentTime = this.time();
    this.lastTime = this.currentTime;

    try {
      const {animation, canvas} = await this.lottie();
      const box = BBox.fromSizeCentered(this.computedSize());

      // Calculate current frame to render
      const speed = this.speed();
      const totalFrames = animation.totalFrames;
      const framerate = animation.frameRate || 30;

      // Ensure animation is loaded and has valid frame count
      if (!totalFrames || totalFrames <= 0) {
        // Show loading message if animation is not loaded or invalid
        const logger = useLogger();
        logger.error(`Lottie rendering error: [No frame found]`);
        return;
      }
      
      if (totalFrames && framerate) {
        const duration = totalFrames / framerate; // Animation total duration (seconds)
        let currentTime = this.currentTime * speed;
        
        // Handle looping
        if (this.loop()) {
          currentTime = currentTime % duration;
        } else {
          currentTime = Math.min(currentTime, duration);
        }
        
        // Calculate target frame - using more precise calculation
        const progress = currentTime / duration;
        const targetFrameFloat = progress * (totalFrames - 1); // Use totalFrames-1 to avoid overflow
        const targetFrame = Math.max(0, Math.min(Math.round(targetFrameFloat), totalFrames - 1));
        
        // Debug information (optional)
        if (speed < 1 && this.currentTime % 1 < 0.1) { // Print debug info occasionally during slow playback
          console.debug(`Lottie Debug: speed=${speed}, currentTime=${this.currentTime.toFixed(2)}, progress=${progress.toFixed(3)}, targetFrame=${targetFrame}/${totalFrames}`);
        }
        
        // Clear canvas
        const lottieContext = canvas.getContext('2d')!;
        //lottieContext.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render specified frame
        animation.goToAndStop(targetFrame, true);
        
        // Wait for rendering completion
        await new Promise(resolve => {
          if (typeof (animation as any).renderFrame === 'function') {
            (animation as any).renderFrame();
          }
          // Use requestAnimationFrame to ensure rendering completion
          requestAnimationFrame(resolve);
        });
      }

      // Draw Lottie canvas to main canvas
      if (canvas && canvas.width > 0 && canvas.height > 0) {
        context.drawImage(canvas, box.x, box.y, box.width, box.height);
      }
      
      if (this.clip()) {
        context.clip(this.getPath());
      }
    } catch (error) {
      const logger = useLogger();
      logger.error(`Lottie rendering error: ${error}`);
    }

    await this.drawChildren(context);
  }

  /**
   * Play animation
   */
  public play() {
    this.lottie().then(({animation}) => {
      animation.play();
    });
  }

  /**
   * Pause animation
   */
  public pause() {
    this.lottie().then(({animation}) => {
      animation.pause();
    });
  }

  /**
   * Stop animation
   */
  public stop() {
    this.lottie().then(({animation}) => {
      animation.stop();
    });
  }

  /**
   * Jump to specified frame
   */
  public goToFrame(frame: number) {
    this.lottie().then(({animation}) => {
      animation.goToAndStop(frame, true);
    });
  }

  /**
   * Jump to specified time (seconds)
   */
  public goToTime(time: number) {
    this.lottie().then(({animation}) => {
      const frame = time * animation.frameRate;
      animation.goToAndStop(frame, true);
    });
  }

  /**
   * Get animation total duration (seconds)
   */
  public async getDuration(): Promise<number> {
    const {animation} = await this.lottie();
    return animation.totalFrames / animation.frameRate;
  }

  /**
   * Get current playback progress (0-1)
   */
  public async getProgress(): Promise<number> {
    const {animation} = await this.lottie();
    const currentFrame = animation.currentFrame;
    const totalFrames = animation.totalFrames;
    return totalFrames > 0 ? currentFrame / totalFrames : 0;
  }
}
