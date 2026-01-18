import type {RenderVideoUserProjectSettings} from '@revideo/core';
import * as fs from 'fs';
import * as path from 'path';
import type {PuppeteerLaunchOptions} from 'puppeteer';
import type {InlineConfig} from 'vite';
import {v4 as uuidv4} from 'uuid';
import {initBrowserAndServer, renderVideoOnPage} from './render-video';

/**
 * Generate a timestamp string for file naming.
 * Format: YYYYMMDD-HHmmss
 */
function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Render images from a revideo project.
 *
 * Unlike renderVideo, this function renders frames directly to PNG images
 * without any ffmpeg post-processing.
 */
export interface RenderImageSettings {
  /** Output directory for images (default: './output') */
  outDir?: string;
  /** 
   * Base name for the output folder (default: 'images').
   * When timestampVersioning is enabled, this becomes the prefix for the timestamped folder.
   */
  outName?: string;
  /**
   * Enable timestamp versioning for output folders.
   * When enabled, images are saved in a timestamped subfolder (e.g., images-20260118-153045/)
   * to preserve different versions. A 'latest' folder is also created/updated.
   * 
   * Default: true
   */
  timestampVersioning?: boolean;
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
  const timestampVersioning = settings.timestampVersioning ?? true;
  const outName = settings.outName ?? 'images';
  const baseOutputDir = path.resolve(settings.outDir ?? './output');
  const hiddenFolderId = uuidv4();
  const port = settings.viteBasePort ?? 9500;

  // Determine the actual output directory
  let outputDir: string;
  let timestampedDir: string | null = null;
  
  if (timestampVersioning) {
    const timestamp = generateTimestamp();
    timestampedDir = path.join(baseOutputDir, `${outName}-${timestamp}`);
    outputDir = timestampedDir;
  } else {
    outputDir = baseOutputDir;
  }

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

  // Create/update 'latest' folder if timestamp versioning is enabled
  if (timestampVersioning && timestampedDir) {
    const latestDir = path.join(baseOutputDir, `${outName}-latest`);
    
    // Remove existing latest folder
    if (fs.existsSync(latestDir)) {
      await fs.promises.rm(latestDir, {recursive: true, force: true});
    }
    
    // Copy timestamped folder to latest
    await fs.promises.cp(timestampedDir, latestDir, {recursive: true});
    
    console.log(`Timestamped version saved to: ${timestampedDir}`);
    console.log(`Latest version saved to: ${latestDir}`);
    
    return [timestampedDir, latestDir];
  }

  return [outputDir];
}
