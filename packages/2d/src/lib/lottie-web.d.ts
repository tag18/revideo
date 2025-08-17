declare module 'lottie-web' {
  export interface AnimationItem {
    play(): void;
    pause(): void;
    stop(): void;
    goToAndStop(value: number, isFrame?: boolean): void;
    goToAndPlay(value: number, isFrame?: boolean): void;
    setSpeed(speed: number): void;
    setDirection(direction: number): void;
    currentFrame: number;
    totalFrames: number;
    frameRate: number;
    isPaused: boolean;
    destroy(): void;
  }

  export interface AnimationConfig {
    container?: Element;
    renderer?: 'svg' | 'canvas' | 'html';
    loop?: boolean | number;
    autoplay?: boolean;
    animationData?: any;
    path?: string;
    rendererSettings?: any;
  }

  export interface LottiePlayer {
    loadAnimation(config: AnimationConfig): AnimationItem;
    destroy(): void;
    setQuality(quality: string | number): void;
  }

  const lottie: LottiePlayer;
  export default lottie;
}
