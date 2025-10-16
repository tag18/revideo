/**
 * Visual Editor Demo Scene
 * 
 * This scene demonstrates how to use the Visual Editor plugin to
 * position nodes visually without modifying source code.
 * 
 * Instructions:
 * 1. Run this scene in the Revideo editor
 * 2. Enable "Visual Editor" in the Inspector panel
 * 3. Select any shape by clicking on it
 * 4. Hold Alt + Click and drag to reposition
 * 5. Green handles will appear showing it's draggable
 * 6. Release to save the position (persists in project meta)
 */

import {makeScene2D, Circle, Rect, Txt, Layout} from '@revideo/2d';
import {createRef, waitFor} from '@revideo/core';

export default makeScene2D('visual-editor-demo', function* (view) {
  const layout = createRef<Layout>();
  
  view.add(
    <Layout
      ref={layout}
      width={'100%'}
      height={'100%'}
      alignItems={'center'}
      justifyContent={'center'}
      gap={50}
      layout
    >
      {/* Red Circle */}
      <Circle
        size={100}
        fill="#E53935"
        position={[-200, -100]}
      >
        <Txt
          fill="white"
          fontSize={20}
          text="Drag Me!"
        />
      </Circle>
      
      {/* Blue Rectangle */}
      <Rect
        size={[150, 100]}
        fill="#1E88E5"
        radius={10}
        position={[200, -100]}
      >
        <Txt
          fill="white"
          fontSize={20}
          text="Move Me!"
        />
      </Rect>
      
      {/* Green Circle */}
      <Circle
        size={80}
        fill="#43A047"
        position={[-200, 100]}
      >
        <Txt
          fill="white"
          fontSize={18}
          text="Alt+Drag"
        />
      </Circle>
      
      {/* Yellow Rectangle */}
      <Rect
        size={[120, 120]}
        fill="#FDD835"
        radius={20}
        position={[200, 100]}
      >
        <Txt
          fill="#333"
          fontSize={18}
          text="Visual\nEditor"
          textAlign={'center'}
        />
      </Rect>
      
      {/* Instructions Text */}
      <Txt
        position={[0, -300]}
        fill="white"
        fontSize={32}
        fontWeight={700}
        text="Visual Editor Demo"
      />
      
      <Txt
        position={[0, 300]}
        fill="#AAA"
        fontSize={18}
        textAlign={'center'}
        text="Hold Alt + Click and Drag shapes to reposition\nPositions are saved in project meta"
      />
    </Layout>
  );
  
  // Keep scene running to allow visual editing
  yield* waitFor(30);
});
