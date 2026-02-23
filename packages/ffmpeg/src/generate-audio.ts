import type {AssetInfo, FfmpegExporterOptions} from '@revideo/core';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {extensions} from './ffmpeg-exporter-server';
import {ffmpegSettings} from './settings';
import type {AudioCodec} from './utils';
import {
  checkForAudioStream,
  getSampleRate,
  makeSureFolderExists,
  mergeAudioWithVideo,
  resolvePath,
} from './utils';

export const audioCodecs: Record<FfmpegExporterOptions['format'], AudioCodec> =
  {
    mp4: 'aac',
    webm: 'libopus',
    proRes: 'aac',
  };

interface MediaAsset {
  key: string;
  src: string;
  type: 'video' | 'audio';
  startInVideo: number;
  endInVideo: number;
  duration: number;
  playbackRate: number;
  volume: number;
  trimLeftInSeconds: number;
  durationInSeconds: number;
  /**
   * Whether the audio is looping.
   * Looping audio uses frame-based duration calculation and aloop filter.
   */
  loop?: boolean;
  /**
   * Volume changes per frame. Format: [[frameOffset, volume], ...]
   * frameOffset is relative to startInVideo.
   * If volumeChanges exist, dynamic volume is applied using afade filter.
   */
  volumeChanges?: Array<[number, number]>;
}

const SAMPLE_RATE = 48000;

function getAssetPlacement(frames: AssetInfo[][]): MediaAsset[] {
  const assets: MediaAsset[] = [];

  // A map to keep track of the first and last currentTime for each asset.
  const assetTimeMap = new Map<string, {start: number; end: number}>();
  // A map to track if the asset is looping
  const assetLoopMap = new Map<string, boolean>();
  // A map to track volume changes per frame for each asset
  const assetVolumeMap = new Map<string, Array<[number, number]>>();

  for (let frame = 0; frame < frames.length; frame++) {
    for (const asset of frames[frame]) {
      if (!assetTimeMap.has(asset.key)) {
        // If the asset is not in the map, add it with its current time as both start and end.
        assetTimeMap.set(asset.key, {
          start: asset.currentTime,
          end: asset.currentTime,
        });
        assetLoopMap.set(asset.key, asset.loop ?? false);
        // Initialize volume tracking with first frame's volume
        assetVolumeMap.set(asset.key, [[0, asset.volume]]);
        assets.push({
          key: asset.key,
          src: asset.src,
          type: asset.type,
          startInVideo: frame,
          endInVideo: frame,
          duration: 0, // Placeholder, will be recalculated later based on frames
          durationInSeconds: 0, // Placeholder, will be calculated based on currentTime
          playbackRate: asset.playbackRate,
          volume: asset.volume,
          trimLeftInSeconds: asset.currentTime,
          loop: asset.loop,
        });
      } else {
        // If the asset is already in the map, update the end time.
        const timeInfo = assetTimeMap.get(asset.key);
        if (timeInfo) {
          timeInfo.end = asset.currentTime;
          assetTimeMap.set(asset.key, timeInfo);
        }

        const existingAsset = assets.find(a => a.key === asset.key);
        if (existingAsset) {
          existingAsset.endInVideo = frame;
          
          // Track volume changes
          const volumeChanges = assetVolumeMap.get(asset.key);
          if (volumeChanges) {
            const frameOffset = frame - existingAsset.startInVideo;
            const lastVolume = volumeChanges[volumeChanges.length - 1][1];
            // Only record if volume changed (with small epsilon for floating point)
            if (Math.abs(asset.volume - lastVolume) > 0.001) {
              volumeChanges.push([frameOffset, asset.volume]);
            }
          }
        }
      }
    }
  }

  // Attach volume changes to assets
  assets.forEach(asset => {
    const volumeChanges = assetVolumeMap.get(asset.key);
    if (volumeChanges && volumeChanges.length > 1) {
      // Only store if there are actual volume changes (more than just initial volume)
      asset.volumeChanges = volumeChanges;
    }
  });

  // Calculate the duration based on frame count and durationInSeconds based on currentTime.
  assets.forEach(asset => {
    const timeInfo = assetTimeMap.get(asset.key);
    const isLooping = assetLoopMap.get(asset.key) ?? false;
    // Recalculate the original duration based on frame count.
    asset.duration = asset.endInVideo - asset.startInVideo + 1;
    
    if (timeInfo) {
      // For looping audio, currentTime wraps around (e.g., 135s -> 0s -> 5s),
      // so we cannot use currentTime difference to calculate duration.
      // Instead, use Infinity to let prepareAudio calculate from frame count.
      if (isLooping) {
        asset.durationInSeconds = Infinity;
        // Keep trimLeftInSeconds as-is (the first frame's currentTime, which may be wrapped)
        // prepareAudio will use global startFrame to calculate correct position
      } else {
        // Calculate durationInSeconds based on the start and end currentTime values.
        asset.durationInSeconds =
          (timeInfo.end - timeInfo.start) / asset.playbackRate;
      }
    }
    
    // WORKAROUND: If currentTime didn't change (stuck at 0), the Audio was created
    // in a sub-thread where useThread().time doesn't update during rendering.
    // Use Infinity to let prepareAudio calculate duration from frame count instead.
    if (asset.durationInSeconds === 0 && asset.duration > 1) {
      asset.durationInSeconds = Infinity;
    }
  });

  return assets;
}

function calculateAtempoFilters(playbackRate: number) {
  const atempoFilters = [];

  // Calculate how many times we need to 100x the speed
  let rate = playbackRate;
  while (rate > 100.0) {
    atempoFilters.push('atempo=100.0');
    rate /= 100.0;
  }
  // Add the last atempo filter with the remaining rate
  if (rate > 1.0) {
    atempoFilters.push(`atempo=${rate}`);
  }

  // Calculate how many times we need to halve the speed
  rate = playbackRate;
  while (rate < 0.5) {
    atempoFilters.push('atempo=0.5');
    rate *= 2.0;
  }
  // Add the last atempo filter with the remaining rate
  if (rate < 1.0) {
    atempoFilters.push(`atempo=${rate}`);
  }

  return atempoFilters;
}
async function prepareAudio(
  outputDir: string,
  tempDir: string,
  asset: MediaAsset,
  startFrame: number,
  endFrame: number,
  fps: number,
): Promise<string> {
  // Construct the output path
  const sanitizedKey = asset.key.replace(/[/[\]]/g, '-');
  const outputPath = path.join(tempDir, `${sanitizedKey}.wav`);

  // For looping audio, we need to ensure enough audio to cover the duration
  const needsLooping = asset.loop && asset.durationInSeconds === Infinity;
  
  // trimLeftInSeconds is the currentTime at the first frame where this audio appears.
  // For looping audio, currentTime wraps around (e.g., at 14s loop point, 16s becomes 2s).
  // This wrapped value is CORRECT for where to start reading in the looped audio,
  // because we use aloop to extend the audio, and the wrapped position is the actual
  // position within each loop iteration.
  const trimLeft = asset.trimLeftInSeconds / asset.playbackRate;
  
  // Calculate the required duration in seconds for this worker's portion
  const requiredDurationInSeconds = (endFrame - startFrame) / fps;
  
  const trimRight =
    1 / fps +
    Math.min(
      trimLeft + asset.durationInSeconds,
      trimLeft + requiredDurationInSeconds,
    );
  const padStart = (asset.startInVideo / fps) * 1000;
  const assetSampleRate = await getSampleRate(
    resolvePath(outputDir, asset.src),
  );

  const padEnd = Math.max(
    0,
    (assetSampleRate * (endFrame - startFrame + 1)) / fps -
      (assetSampleRate * asset.duration) / fps -
      (assetSampleRate * padStart) / 1000,
  );

  const atempoFilters = calculateAtempoFilters(asset.playbackRate); // atempo filter value must be >=0.5 and <=100. If the value is higher or lower, this function sets multiple atempo filters
  const resolvedPath = resolvePath(outputDir, asset.src);

  await new Promise<void>((resolve, reject) => {
    const audioFilters: string[] = [];
    
    // For looping audio, use aloop filter to repeat the audio
    // aloop: loop=-1 means infinite, size is number of samples to loop (use large value)
    // We calculate loops needed based on required duration AND trimLeft offset
    if (needsLooping) {
      // Need enough loops to cover: trimLeft + requiredDuration
      // Use a generous estimate to ensure we have enough audio
      const totalDurationNeeded = trimLeft + requiredDurationInSeconds + 5; // +5s buffer
      const estimatedAudioLength = 10; // Conservative estimate for short audio files
      const loopCount = Math.ceil(totalDurationNeeded / estimatedAudioLength) + 2;
      audioFilters.push(`aloop=loop=${loopCount}:size=2e+09`);
    }
    
    audioFilters.push(...atempoFilters);
    audioFilters.push(`atrim=start=${trimLeft}:end=${trimRight}`);
    audioFilters.push(`apad=pad_len=${padEnd}`);
    audioFilters.push(`adelay=${padStart}|${padStart}|${padStart}`);
    
    // Handle dynamic volume changes
    if (asset.volumeChanges && asset.volumeChanges.length > 1) {
      // Detect fade out pattern: initial volume > final volume
      const firstVolume = asset.volumeChanges[0][1];
      const lastChange = asset.volumeChanges[asset.volumeChanges.length - 1];
      const lastVolume = lastChange[1];
      const fadeStartFrame = asset.volumeChanges.length > 1 
        ? asset.volumeChanges[1][0] // First volume change marks fade start
        : lastChange[0];
      
      // Calculate fade parameters in seconds
      // IMPORTANT: afade's st= is relative to the audio stream AFTER atrim
      // fadeStartFrame is relative to asset.startInVideo (when audio first appeared)
      // So we need to calculate the time relative to the start of this audio clip
      const fadeStartTimeInVideo = fadeStartFrame / fps; // Time in video from when audio started
      const fadeDuration = (lastChange[0] - fadeStartFrame) / fps;
      
      // Apply initial volume
      audioFilters.push(`volume=${firstVolume}`);
      
      if (lastVolume < firstVolume && fadeDuration > 0) {
        // Fade out detected: use afade filter
        // afade: t=out for fade out, st=start time (relative to audio stream after filters), d=duration
        // Since we're applying adelay to pad the start, the fade time needs to account for:
        // - The adelay adds padStart ms of silence at the beginning
        // - After adelay, the audio plays from trimLeft
        // So the actual fade start time in the filtered stream is:
        //   padStart/1000 + fadeStartTimeInVideo
        const fadeStartInStream = (padStart / 1000) + fadeStartTimeInVideo;
        
        // For simplicity, if fading close to zero (< 0.05), use afade
        // Use 'qsin' (quarter sine) curve - gentle at start, faster at end
        if (lastVolume < 0.05) {
          const fadeFilter = `afade=t=out:st=${fadeStartInStream}:d=${fadeDuration}:curve=qsin`;
          audioFilters.push(fadeFilter);
        } else {
          // For partial fade (not to zero), use volume expression with interpolation
          // volume='if(gte(t,ST),V1+(V2-V1)*(t-ST)/D,V1)'
          const v1 = 1; // Already scaled by initial volume above
          const v2 = lastVolume / firstVolume;
          audioFilters.push(
            `volume='if(lt(t,${fadeStartInStream}),1,if(gt(t,${fadeStartInStream + fadeDuration}),${v2},1+(${v2}-1)*(t-${fadeStartInStream})/${fadeDuration}))':eval=frame`
          );
        }
      } else if (lastVolume > firstVolume && fadeDuration > 0) {
        // Fade in detected
        const fadeStartInStream = (padStart / 1000) + fadeStartTimeInVideo;
        audioFilters.push(`afade=t=in:st=${fadeStartInStream}:d=${fadeDuration}:curve=tri`);
      }
      // If no fade pattern detected, the initial volume is already applied
    } else {
      // Static volume
      audioFilters.push(`volume=${asset.volume}`);
    }

    ffmpeg.setFfmpegPath(ffmpegSettings.getFfmpegPath());
    
    ffmpeg(resolvedPath)
      .audioChannels(2)
      .audioCodec('pcm_s16le')
      .audioFrequency(SAMPLE_RATE)
      .outputOptions([`-af`, audioFilters.join(',')])
      .on('end', () => {
        resolve();
      })
      .on('error', err => {
        console.error(
          `Error processing audio for asset key: ${asset.key}`,
          err,
        );
        reject(err);
      })
      .save(outputPath);
  });

  return outputPath;
}

async function mergeAudioTracks(
  tempDir: string,
  audioFilenames: string[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg.setFfmpegPath(ffmpegSettings.getFfmpegPath());
    const command = ffmpeg();

    audioFilenames.forEach(filename => {
      command.input(filename);
    });

    command
      .complexFilter([
        `amix=inputs=${audioFilenames.length}:duration=longest:normalize=0`,
      ])
      .outputOptions(['-c:a', 'pcm_s16le'])
      .on('end', () => {
        resolve();
      })
      .on('error', err => {
        console.error(`Error merging audio tracks: ${err.message}`);
        reject(err);
      })
      .save(path.join(tempDir, `audio.wav`));
  });
}

export async function generateAudio({
  outputDir,
  tempDir,
  assets,
  startFrame,
  endFrame,
  fps,
}: {
  outputDir: string;
  tempDir: string;
  assets: AssetInfo[][];
  startFrame: number;
  endFrame: number;
  fps: number;
}) {
  const fullTempDir = path.join(os.tmpdir(), tempDir);
  await makeSureFolderExists(outputDir);
  await makeSureFolderExists(fullTempDir);

  const assetPositions = getAssetPlacement(assets);
  const audioFilenames: string[] = [];

  for (const asset of assetPositions) {
    let hasAudioStream = true;
    if (asset.type !== 'audio') {
      hasAudioStream = await checkForAudioStream(
        resolvePath(outputDir, asset.src),
      );
    }

    if (asset.playbackRate !== 0 && asset.volume !== 0 && hasAudioStream) {
      const filename = await prepareAudio(
        outputDir,
        fullTempDir,
        asset,
        startFrame,
        endFrame,
        fps,
      );
      audioFilenames.push(filename);
    }
  }

  if (audioFilenames.length > 0) {
    await mergeAudioTracks(fullTempDir, audioFilenames);
  }

  return audioFilenames;
}

export async function mergeMedia(
  outputFilename: string,
  outputDir: string,
  tempDir: string,
  format: FfmpegExporterOptions['format'],
) {
  const fullTempDir = path.join(os.tmpdir(), tempDir);
  await makeSureFolderExists(outputDir);
  await makeSureFolderExists(fullTempDir);

  const audioWavExists = fs.existsSync(path.join(fullTempDir, `audio.wav`));
  if (audioWavExists) {
    await mergeAudioWithVideo(
      path.join(fullTempDir, `audio.wav`),
      path.join(fullTempDir, `visuals.${extensions[format]}`),
      path.join(outputDir, `${outputFilename}.${extensions[format]}`),
      audioCodecs[format],
    );
  } else {
    const destination = path.join(
      outputDir,
      `${outputFilename}.${extensions[format]}`,
    );
    await fs.promises.copyFile(
      path.join(fullTempDir, `visuals.${extensions[format]}`),
      destination,
    );
  }
  if (fullTempDir.endsWith('-undefined')) {
    await fs.promises
      .rm(fullTempDir, {recursive: true, force: true})
      .catch(() => {});
  }
}
