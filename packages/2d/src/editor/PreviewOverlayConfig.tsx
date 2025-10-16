import {transformVectorAsPoint, Vector2} from '@revideo/core';
import type {PluginOverlayConfig} from '@revideo/ui';
import {
  MouseButton,
  OverlayWrapper,
  useApplication,
  useViewportContext,
  useViewportMatrix,
} from '@revideo/ui';
import type {ComponentChildren} from 'preact';
import {useRef} from 'preact/hooks';
import {usePluginState} from './Provider';
import {visualEditorState} from './VisualEditorState';

function Component({children}: {children?: ComponentChildren}) {
  const state = useViewportContext();
  const {scene, selectedKey} = usePluginState();
  const {player} = useApplication();
  const matrix = useViewportMatrix();
  
  const dragStartPos = useRef<Vector2 | null>(null);
  const dragStartScreen = useRef<Vector2 | null>(null);

  return (
    <OverlayWrapper
      onPointerDown={event => {
        if (event.button !== MouseButton.Left) return;
        if (!scene.value) return;

        const screenPos = new Vector2(
          event.x - state.rect.x,
          event.y - state.rect.y,
        );
        const scenePos = transformVectorAsPoint(screenPos, matrix.inverse());

        // Check if Alt key is pressed for visual editing mode
        const isVisualEditMode = event.altKey && visualEditorState.enabled.value;

        if (isVisualEditMode) {
          // Visual edit mode: try to drag existing selected node OR newly clicked node
          let nodeKey = selectedKey.value;
          
          // If nothing is selected, try to select the node at click position
          if (!nodeKey) {
            nodeKey = scene.value.inspectPosition(scenePos.x, scenePos.y) as string;
            console.log('[Visual Editor] Click detection:', {
              scenePos,
              detectedNode: nodeKey,
              allNodes: scene.value ? Array.from(scene.value.getView().children()).map((n: any) => ({
                key: n.key,
                type: n.constructor.name,
                position: n.position(),
                bbox: n.cacheBBox(),
              })) : [],
            });
            if (nodeKey) {
              selectedKey.value = nodeKey;
            }
          }
          
          if (nodeKey) {
            let node = scene.value.getNode(nodeKey);
            if (node) {
              // If we detected a TxtLeaf node, use its parent Txt node instead
              // TxtLeaf is an internal child of Txt and we want to drag the parent
              if (node.constructor.name === 'TxtLeaf') {
                const parent = node.parent();
                if (parent && parent.constructor.name === 'Txt') {
                  console.log(`[Visual Editor] Detected TxtLeaf, using parent Txt node instead`);
                  node = parent;
                  nodeKey = parent.key;
                  selectedKey.value = nodeKey;
                }
              }
              
              event.stopPropagation();
              dragStartPos.current = node.position();
              dragStartScreen.current = scenePos; // Use scene coordinates
              visualEditorState.startDrag(nodeKey, dragStartPos.current);
              console.log(`[Visual Editor] Drag started for ${nodeKey}`, {
                position: dragStartPos.current,
                nodeType: node.constructor.name,
              });
              return;
            }
          }
        }

        // Normal mode: select node
        if (!event.shiftKey) {
          event.stopPropagation();
          selectedKey.value = scene.value.inspectPosition(
            scenePos.x,
            scenePos.y,
          ) as string;
        }
      }}
      onPointerMove={event => {
        const drag = visualEditorState.dragState.value;
        if (drag && drag.isDragging && dragStartScreen.current && dragStartPos.current) {
          event.stopPropagation();
          
          // Convert current mouse position to scene coordinates
          const currentScreen = new Vector2(
            event.x - state.rect.x,
            event.y - state.rect.y,
          );
          const currentScene = transformVectorAsPoint(currentScreen, matrix.inverse());
          
          // Calculate delta in scene space
          const sceneDelta = currentScene.sub(dragStartScreen.current);
          
          // Update node position in real-time
          const node = scene.value?.getNode(drag.nodeKey);
          if (node) {
            const newPos = dragStartPos.current.add(sceneDelta);
            node.position(newPos);
            visualEditorState.updateDrag(sceneDelta);
            
            // Optionally trigger re-render during drag (performance vs preview)
            if (visualEditorState.renderDuringDrag.value) {
              player.requestRender();
            }
          }
        }
      }}
      onPointerUp={event => {
        const drag = visualEditorState.dragState.value;
        if (drag && drag.isDragging) {
          event.stopPropagation();
          
          // Calculate final position
          const finalPosition = dragStartPos.current!.add(drag.currentOffset);
          
          console.log(`[Visual Editor] Drag ended for ${drag.nodeKey}:`, {
            startPos: dragStartPos.current,
            offset: drag.currentOffset,
            finalPos: finalPosition,
          });
          
          // End drag and save override
          visualEditorState.endDrag();
          
          // Apply the override to the node immediately
          const node = scene.value?.getNode(drag.nodeKey);
          if (node) {
            console.log(`[Visual Editor] Applying position to node ${drag.nodeKey}`);
            node.position(finalPosition);
          } else {
            console.warn(`[Visual Editor] Node not found: ${drag.nodeKey}`);
          }
          
          dragStartPos.current = null;
          dragStartScreen.current = null;
          
          // Trigger re-render when drag ends
          player.requestRender();
        }
      }}
    >
      {children}
    </OverlayWrapper>
  );
}

function drawHook() {
  const {selectedKey, hoveredKey, afterRender, scene} = usePluginState();
  selectedKey.value;
  hoveredKey.value;
  afterRender.value;
  visualEditorState.dragState.value;
  visualEditorState.enabled.value;

  return (ctx: CanvasRenderingContext2D, matrix: DOMMatrix) => {
    const currentScene = scene.peek();
    if (!currentScene) return;

    let node = currentScene.getNode(selectedKey.value);
    if (node) {
      currentScene.drawOverlay(node.key, matrix, ctx);
      
      // Draw drag handles if visual editor is enabled
      if (visualEditorState.enabled.peek()) {
        drawDragHandles(ctx, node, matrix);
      }
    }

    node = currentScene.getNode(hoveredKey.value);
    if (node && hoveredKey.value !== selectedKey.value) {
      ctx.globalAlpha = 0.5;
      currentScene.drawOverlay(hoveredKey.value, matrix, ctx);
      ctx.globalAlpha = 1.0;
    }
  };
}

/**
 * Draw drag handles at the four corners of the selected node
 */
function drawDragHandles(
  ctx: CanvasRenderingContext2D,
  node: any,
  matrix: DOMMatrix,
): void {
  // Get the node's current world transform
  const nodeMatrix = matrix.multiply(node.localToWorld());
  
  // Get the local bounding box
  const bbox = node.cacheBBox();
  
  // Transform corners to screen space
  const corners = [
    transformVectorAsPoint(new Vector2(bbox.left, bbox.top), nodeMatrix),
    transformVectorAsPoint(new Vector2(bbox.right, bbox.top), nodeMatrix),
    transformVectorAsPoint(new Vector2(bbox.right, bbox.bottom), nodeMatrix),
    transformVectorAsPoint(new Vector2(bbox.left, bbox.bottom), nodeMatrix),
  ];
  
  const handleSize = 8;
  const handleColor = '#4CAF50';
  const handleBorder = '#2E7D32';

  // Draw handles at each corner
  corners.forEach(corner => {
    // Fill
    ctx.fillStyle = handleColor;
    ctx.fillRect(
      corner.x - handleSize / 2,
      corner.y - handleSize / 2,
      handleSize,
      handleSize,
    );

    // Border
    ctx.strokeStyle = handleBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      corner.x - handleSize / 2,
      corner.y - handleSize / 2,
      handleSize,
      handleSize,
    );
  });

  // Draw center handle (for position)
  const center = transformVectorAsPoint(
    new Vector2(bbox.center.x, bbox.center.y),
    nodeMatrix,
  );

  ctx.beginPath();
  ctx.arc(center.x, center.y, handleSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#2196F3';
  ctx.fill();
  ctx.strokeStyle = '#1565C0';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export const PreviewOverlayConfig: PluginOverlayConfig = {
  drawHook,
  component: Component,
};
