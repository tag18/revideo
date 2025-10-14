import path from 'path';
import {Plugin} from 'vite';
import {createMeta} from '../utils';

const SCENE_FILE_REGEX = /\/scenes\/[^/]+\.tsx?$/;

export function scenesPlugin(): Plugin {
  return {
    name: 'revideo:scenes',

    async transform(code, id) {
      // Check if this is a scene file (in /scenes/ directory)
      if (!SCENE_FILE_REGEX.test(id)) {
        return;
      }

      // Check if this file exports a scene (uses makeScene2D)
      if (!code.includes('makeScene2D') || !code.includes('export default')) {
        return;
      }

      const [base] = id.split('?');
      const {name, dir} = path.posix.parse(base);
      const metaFile = `${name}.meta`;
      const metaPath = path.join(dir, metaFile);

      // Create meta file if it doesn't exist
      await createMeta(metaPath);

      // Replace "export default makeScene2D(" with "const _sceneExport = makeScene2D("
      let modifiedCode = code.replace(
        /export default makeScene2D\(/,
        'const _sceneExport = makeScene2D(',
      );

      // Add imports at the beginning
      const imports = `import _sceneMetaFile from './${metaFile}';\nimport {ValueDispatcher} from '@revideo/core';\n\n`;
      modifiedCode = imports + modifiedCode;

      // Add the meta attachment and HMR code at the end
      modifiedCode += `

// Attach meta file and setup HMR
_sceneExport.name = '${name}';
_sceneMetaFile.attach(_sceneExport.meta);

if (import.meta.hot) {
  _sceneExport.onReplaced = import.meta.hot.data.onReplaced;
}
_sceneExport.onReplaced ??= new ValueDispatcher(_sceneExport.config);
if (import.meta.hot) {
  import.meta.hot.accept();
  if (import.meta.hot.data.onReplaced) {
    _sceneExport.onReplaced.current = _sceneExport;
  } else {
    import.meta.hot.data.onReplaced = _sceneExport.onReplaced;
  }
}

export default _sceneExport;
`;

      return {
        code: modifiedCode,
        map: null,
      };
    },
  };
}
