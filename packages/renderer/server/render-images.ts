import type {RenderVideoUserProjectSettings} from '@revideo/core';
import * as fs from 'fs';
import * as path from 'path';
import type {PuppeteerLaunchOptions} from 'puppeteer';
import type {InlineConfig} from 'vite';
import {v4 as uuidv4} from 'uuid';
import {initBrowserAndServer, renderVideoOnPage} from './render-video';

/**
 * Render images from a revideo project.
 *
 * Unlike renderVideo, this function renders frames directly to PNG images
 * without any ffmpeg post-processing.
 */
export interface RenderImageSettings {
  /** Output directory for images (default: './output') */
  outDir?: string;
  /** Puppeteer launch options */
  puppeteer?: PuppeteerLaunchOptions;
  /** Project settings to override */
  projectSettings?: RenderVideoUserProjectSettings;
  /** Vite configuration */
  viteConfig?: InlineConfig;
  /** Port for Vite server (default: 9500) */
  viteBasePort?: number;
}

export interface RenderImageParams {
  /** Path to the project file */
  projectFile: string;
  /** Render settings */
  settings?: RenderImageSettings;
  /** Variables to pass to the project */
  variables?: Record<string, unknown>;
}


/**
 * Render a project to PNG images.
 */
export async function renderImages({
  projectFile,
  settings = {},
  variables,
}: RenderImageParams): Promise<string[]> {
  const outputDir = path.resolve(settings.outDir ?? './output');
  const hiddenFolderId = uuidv4();
  const port = settings.viteBasePort ?? 9500;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {recursive: true});
  }

  const projectSettingsWithImageExporter: RenderVideoUserProjectSettings = {
    ...settings.projectSettings,
    exporter: {
      name: '@revideo/core/image-sequence',
      options: {
        fileType: 'image/png',
        quality: 100,
        groupByScene: true,
      },
    },
  };

  const {browser, server, resolvedPort} = await initBrowserAndServer(
    port,
    projectFile,
    outputDir,
    {
      puppeteer: settings.puppeteer,
      viteConfig: settings.viteConfig,
      projectSettings: projectSettingsWithImageExporter,
    },
    variables,
    true,
  );

  const url = `http://localhost:${resolvedPort}/render?fileName=image&workerId=0&totalNumOfWorkers=1&hiddenFolderId=${encodeURIComponent(hiddenFolderId)}`;
  await renderVideoOnPage(0, browser, server, url, new Map(), undefined, true);

  return [outputDir];
}
