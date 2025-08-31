import {makeProject} from '@revideo/core';

import basicCamera from './scenes/camera-scene';
import advancedCamera from './scenes/camera-advanced';
import apiCamera from './scenes/camera-api';
import imageZoomPan from './scenes/image-zoom-pan';
import highResViewer from './scenes/high-res-viewer';
import optimizedImageQuality from './scenes/optimized-image-quality';
import ultraHighQuality from './scenes/ultra-high-quality';
import browserOptimizedQuality from './scenes/browser-optimized-quality';
import denoiseOptimizedQuality from './scenes/denoise-optimized-quality';
import shadowDance from './scenes/shadow-dance';

export default makeProject({
  scenes: [
    //basicCamera, advancedCamera, apiCamera, imageZoomPan, highResViewer, optimizedImageQuality,
    shadowDance,
    ultraHighQuality,
    //browserOptimizedQuality, denoiseOptimizedQuality
    ],
  settings: {
    rendering: {
      exporter: {
        // name: '@revideo/core/image-sequence',
        // options: {
        //   fileType: 'image/png',
        //   quality: 100,
        //   groupByScene: true,
        // },

        name: '@revideo/core/ffmpeg',
        options:{
          format: 'mp4'
        }
      },
      fps: 30,
      resolutionScale: 1,
      colorSpace: 'srgb',
    },
  }
});
