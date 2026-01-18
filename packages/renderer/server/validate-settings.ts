import type {FfmpegExporterOptions} from '@revideo/core';
import type {RenderSettings} from 'render-video';
import * as path from 'path';
import {v4 as uuidv4} from 'uuid';

/**
 * Extract a default output filename from the project file path.
 * e.g., './src/products/巨鹿之战/julu.tsx' → 'julu'
 */
function getDefaultOutputName(projectFile: string): string {
  const basename = path.basename(projectFile);
  // Remove extension (.tsx, .ts, .js, etc.)
  const nameWithoutExt = basename.replace(/\.(tsx?|jsx?|mjs|cjs)$/, '');
  return nameWithoutExt || 'video';
}

export function getParamDefaultsAndCheckValidity(
  settings: RenderSettings,
  projectFile?: string,
): {
  outputFileName: string;
  outputFolderName: string;
  numOfWorkers: number;
  hiddenFolderId: string;
  format: FfmpegExporterOptions['format'];
} {
  // Derive default output name from project file if available
  const defaultOutputName = projectFile 
    ? getDefaultOutputName(projectFile) 
    : 'video';

  const defaultReturn = {
    outputFileName: defaultOutputName,
    outputFolderName: settings.outDir ?? './output',
    numOfWorkers: settings.workers ?? 1,
    hiddenFolderId: uuidv4(),
  } as {
    outputFileName: string;
    outputFolderName: string;
    numOfWorkers: number;
    hiddenFolderId: string;
  };

  // Image sequence exporter is not supported in renderVideo or renderPartialVideo
  if (
    settings.projectSettings?.exporter?.name === '@revideo/core/image-sequence'
  ) {
    throw Error(
      'You cannot use the image sequence exporter with renderVideo or renderPartialVideo. Please use the editor to export images',
    );
  }

  const extension = settings.outFile?.split('.').pop();
  const outFileWithoutExtension = settings.outFile
    ?.split('.')
    .slice(0, -1)
    .join('.');

  // If the output file name is not provided, use the default derived from project file
  if (!outFileWithoutExtension) {
    return {
      ...defaultReturn,
      outputFileName: defaultOutputName,
      format: 'mp4',
    };
  }

  // Wasm exporter only supports exporting to mp4
  if (
    settings.projectSettings?.exporter?.name === '@revideo/core/wasm' &&
    extension !== 'mp4'
  ) {
    throw Error(
      'The Wasm Exporter only supports exporting to mp4. Please adjust the extension of your output file name',
    );
  }

  // If we are using the wasm exporter, we don't need to validate further
  if (settings.projectSettings?.exporter?.name === '@revideo/core/wasm') {
    return {
      ...defaultReturn,
      outputFileName: outFileWithoutExtension,
      format: 'mp4',
    };
  }

  // If we are using the ffmpeg exporter, we need to check the extension matches the format
  if (
    settings.projectSettings?.exporter?.options.format === 'mp4' &&
    extension !== 'mp4'
  ) {
    throw Error(
      "You've chosen mp4 as your file format in the exporter options, but your outFile does not have a mp4 extension. Please use an mp4 extension",
    );
  }

  if (
    settings.projectSettings?.exporter?.options.format === 'webm' &&
    extension !== 'webm'
  ) {
    throw Error(
      "You've chosen webm as your file format in the exporter options, but your outFile does not have a webm extension. Please use a webm extension",
    );
  }

  if (
    settings.projectSettings?.exporter?.options.format === 'proRes' &&
    extension !== 'mov'
  ) {
    throw Error(
      "You've chosen proRes as your file format in the exporter options, but your outFile does not have a mov extension. Please use a mov extension",
    );
  }

  return {
    ...defaultReturn,
    outputFileName: outFileWithoutExtension,
    format: settings.projectSettings?.exporter?.options.format ?? 'mp4',
  };
}
