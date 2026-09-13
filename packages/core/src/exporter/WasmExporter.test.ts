import loadMp4Module from 'mp4-wasm';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {getFullRenderingSettings, makeProject} from '../app';
import {WasmExporter} from './WasmExporter';

vi.mock('mp4-wasm', () => ({default: vi.fn()}));

const createEncoder = vi.fn();
const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(loadMp4Module).mockResolvedValue({createWebCodecsEncoder: createEncoder});
  fetchMock.mockResolvedValue({arrayBuffer: async () => new ArrayBuffer(0)});
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('WasmExporter effective render settings', () => {
  test.each([
    {scale: 1, fps: 30, width: 1920, height: 1080},
    {scale: 0.5, fps: 30, width: 960, height: 540},
    {scale: 0.5, fps: 15, width: 960, height: 540},
    {scale: 0.25, fps: 60, width: 480, height: 270},
  ])('encodes scale=$scale and fps=$fps using the effective settings', async ({scale, fps, width, height}) => {
    const project = makeProject({scenes: []});
    const settings = {
      ...getFullRenderingSettings(project),
      name: project.name,
      hiddenFolderId: 'test',
      resolutionScale: scale,
      fps,
    };
    const exporter = await WasmExporter.create(project, settings);

    await exporter.start();
    expect(createEncoder).toHaveBeenCalledWith({width, height, fps});

    await exporter.generateAudio([], 0, fps);
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/audio-processing/generate-audio',
      expect.objectContaining({
        body: expect.stringContaining(`"fps":${fps}`),
      }),
    );
    expect(project.settings.rendering.fps).toBe(30);
    expect(project.settings.rendering.resolutionScale).toBe(1);
  });

  test('matches the integer pixel dimensions of the scaled canvas', async () => {
    const project = makeProject({
      scenes: [],
      settings: {shared: {size: {x: 1921, y: 1081}}},
    });
    const exporter = await WasmExporter.create(project, {
      ...getFullRenderingSettings(project),
      name: project.name,
      resolutionScale: 0.5,
    });

    await exporter.start();
    expect(createEncoder).toHaveBeenCalledWith({width: 960, height: 540, fps: 30});
  });
});
