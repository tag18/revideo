import type {AssetInfo} from '../app';

function getUrlBase(): string {
  return typeof window === 'undefined'
    ? 'http://localhost/'
    : window.location.href;
}

function normalizeVideoSrc(src: string): string {
  try {
    return new URL(src, getUrlBase()).href;
  } catch {
    return src;
  }
}

function getVideoExtension(src: string): string | null {
  try {
    const {pathname} = new URL(src, getUrlBase());
    return pathname.split('.').pop()?.toLowerCase() ?? null;
  } catch {
    return src
      .split('?')[0]
      .split('#')[0]
      .split('.')
      .pop()
      ?.toLowerCase() ?? null;
  }
}

function usesFfmpegDecoder(asset: AssetInfo): boolean {
  if (asset.type !== 'video') {
    return false;
  }

  if (asset.decoder === 'ffmpeg') {
    return true;
  }

  if (asset.decoder === 'slow' || asset.decoder === 'web') {
    return false;
  }

  // Match Video.seekFunction(): implicit .webm renders use the ffmpeg decoder.
  return getVideoExtension(asset.src) === 'webm';
}

export async function download(assets: AssetInfo[][]): Promise<void> {
  const videoRanges: Map<string, {start: number; end: number}> = new Map();

  assets.forEach(frameAssets => {
    frameAssets.forEach(asset => {
      if (!usesFfmpegDecoder(asset)) {
        return;
      }

      const normalizedSrc = normalizeVideoSrc(asset.src);

      if (videoRanges.has(normalizedSrc)) {
        const range = videoRanges.get(normalizedSrc)!;
        range.start = Math.min(range.start, asset.currentTime);
        range.end = Math.max(range.end, asset.currentTime);
        return;
      }

      videoRanges.set(normalizedSrc, {
        start: asset.currentTime,
        end: asset.currentTime,
      });
    });
  });

  const videoDurations = Array.from(videoRanges.entries()).map(
    ([src, {start, end}]) => ({
      src,
      startTime: start,
      endTime: end,
    }),
  );

  videoDurations.forEach(({src, startTime, endTime}) => {
    console.log(`downloading ${src} from ${startTime}s to ${endTime}s`);
  });

  if (videoDurations.length === 0) {
    return;
  }

  const response = await fetch(
    '/revideo-ffmpeg-decoder/download-video-chunks',
    {
      method: 'POST',
      headers: {
        // eslint-disable-next-line
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(videoDurations),
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(`Error downloading video chunks: ${result.error}`);
  }

  console.log('finished downloading');
}
