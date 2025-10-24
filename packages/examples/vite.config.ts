import motionCanvas from '@revideo/vite-plugin';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [
    motionCanvas({
      project: [
        './src/quickstart.ts',
        './src/tex.ts',
        './src/lottie.ts',
        './src/rive.ts',
        './src/tweening-linear.ts',
        './src/tweening-cubic.ts',
        './src/tweening-color.ts',
        './src/tweening-vector.ts',
        './src/tweening-visualiser.ts',
        './src/node-signal.ts',
        './src/code-block.ts',
        './src/layout.ts',
        './src/layout-group.ts',
        './src/positioning.ts',
        './src/media-image.ts',
        './src/media-video.ts',
        './src/components.ts',
        './src/logging.ts',
        './src/transitions.ts',
        './src/tweening-spring.ts',
        './src/tweening-save-restore.ts',
        './src/presentation.ts',
        './src/camera-basic.ts',
        './src/camera-multi.ts',
        './src/masked-animation.ts',
        './src/image-masked-text.ts',
        './src/explosive-text.ts',
        './src/melting-text.ts',
        './src/shadow-dance.ts',
        './src/spin-3d.ts',
        './src/dropping-texts.ts',
        './src/strong-text.ts',
        './src/aurora-text.ts',
        './src/time-events-basic.ts',
        './src/bookmark-demo.ts',
      ],
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        dir: '../docs/static/examples',
        entryFileNames: '[name].js',
      },
    },
  },
});
