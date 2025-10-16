import {useComputed} from '@preact/signals';
import type {PluginInspectorConfig} from '@revideo/ui';
import {
  Button,
  Group,
  Label,
  Pane,
  Separator,
  useApplication,
} from '@revideo/ui';
import {visualEditorState} from './VisualEditorState';

const VisualEditorInspectorKey = '@revideo/2d/visual-editor';

function Component() {
  const {inspection} = useApplication();
  
  const overrideCount = useComputed(() => {
    return visualEditorState.overrides.value.size;
  });
  
  const isEnabled = useComputed(() => {
    return visualEditorState.enabled.value;
  });
  
  const renderDuringDrag = useComputed(() => {
    return visualEditorState.renderDuringDrag.value;
  });

  return (
    <Pane title="Visual Editor" id="visual-editor-pane">
      <Separator size={1} />
      
      <Group>
        <Label>Status</Label>
        <div style={{color: isEnabled.value ? '#4CAF50' : '#F44336'}}>
          {isEnabled.value ? 'Enabled' : 'Disabled'}
        </div>
      </Group>
      
      <Group>
        <Label>Mode</Label>
        <Button
          onClick={() => {
            visualEditorState.enabled.value = !visualEditorState.enabled.value;
          }}
        >
          {isEnabled.value ? 'Disable' : 'Enable'}
        </Button>
      </Group>
      
      <Separator size={1} />
      
      <Group>
        <Label>Realtime Render</Label>
        <Button
          onClick={() => {
            visualEditorState.renderDuringDrag.value = !visualEditorState.renderDuringDrag.value;
          }}
        >
          {renderDuringDrag.value ? 'ON (Smooth)' : 'OFF (Fast)'}
        </Button>
      </Group>
      
      <Group>
        <Label />
        <div style={{fontSize: '11px', color: '#888', padding: '4px 0'}}>
          {renderDuringDrag.value 
            ? 'Renders every frame while dragging (smooth but slower)'
            : 'Only renders when drag ends (faster performance)'}
        </div>
      </Group>
      
      <Separator size={1} />
      
      <Group>
        <Label>Position Overrides</Label>
        <div>{overrideCount.value} node(s)</div>
      </Group>
      
      <Group>
        <Label />
        <Button
          onClick={() => {
            visualEditorState.clearAll();
          }}
          disabled={overrideCount.value === 0}
        >
          Clear All Overrides
        </Button>
      </Group>
      
      <Separator size={1} />
      
      <Group>
        <Label>Usage</Label>
        <div style={{fontSize: '12px', lineHeight: '1.5', padding: '8px 0'}}>
          <p style={{margin: '4px 0'}}>
            <strong>Hold Alt + Click</strong> to drag nodes
          </p>
          <p style={{margin: '4px 0', color: '#888'}}>
            Green handles show draggable nodes
          </p>
          <p style={{margin: '4px 0', color: '#888'}}>
            Positions are saved to project meta
          </p>
        </div>
      </Group>
      
      {overrideCount.value > 0 && (
        <>
          <Separator size={1} />
          <Group>
            <Label>Overridden Nodes</Label>
          </Group>
          {Array.from(visualEditorState.overrides.value.entries()).map(
            ([key, override]) => (
              <Group key={key}>
                <Label style={{fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                  {key}
                </Label>
                <Button
                  onClick={() => {
                    visualEditorState.removeOverride(key);
                  }}
                  style={{fontSize: '10px', padding: '2px 6px'}}
                >
                  Reset
                </Button>
              </Group>
            ),
          )}
        </>
      )}
    </Pane>
  );
}

export const VisualEditorInspectorConfig: PluginInspectorConfig = {
  key: VisualEditorInspectorKey,
  component: Component,
};

export {VisualEditorInspectorKey};
