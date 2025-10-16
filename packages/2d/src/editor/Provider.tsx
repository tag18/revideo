import type {ReadonlySignal, Signal} from '@preact/signals';
import {computed, signal, useSignalEffect} from '@preact/signals';
import type {Scene2D} from '@revideo/2d';
import {SceneRenderEvent} from '@revideo/core';
import {useApplication, useCurrentScene} from '@revideo/ui';
import type {ComponentChildren} from 'preact';
import {createContext} from 'preact';
import {useContext, useMemo} from 'preact/hooks';
import {visualEditorState} from './VisualEditorState';

export interface PluginState {
  selectedKey: Signal<string | null>;
  hoveredKey: Signal<string | null>;
  openNodes: Map<string, boolean>;
  scene: ReadonlySignal<Scene2D | null>;
  selectedChain: ReadonlySignal<Set<string>>;
  afterRender: ReadonlySignal<number>;
}

const PluginContext = createContext<PluginState | null>(null);

export const NodeInspectorKey = '@revideo/2d/node-inspector';

export function usePluginState() {
  return useContext(PluginContext)!;
}

export function Provider({children}: {children?: ComponentChildren}) {
  const {inspection} = useApplication();
  const currentScene = useCurrentScene();

  const state = useMemo(() => {
    const scene = signal(currentScene as Scene2D);
    const selectedKey = signal<string | null>(null);
    const afterRender = signal(0);
    const hoveredKey = signal<string | null>(null);
    const openNodes = new Map<string, boolean>();
    const selectedChain = computed(() => {
      const chain = new Set<string>();
      const key = selectedKey.value;
      const selectedNode = scene.value?.getNode(key);
      if (selectedNode) {
        let node = selectedNode.parent() ?? null;
        while (node) {
          chain.add(node.key);
          node = node.parent();
        }
      }

      return chain;
    });

    return {
      selectedKey,
      hoveredKey,
      afterRender,
      openNodes,
      selectedChain,
      scene,
    } satisfies PluginState;
  }, []);

  state.scene.value = currentScene as Scene2D;

  useSignalEffect(() =>
    state.scene.value?.onRenderLifecycle.subscribe(([event]) => {
      if (event === SceneRenderEvent.AfterRender) {
        state.afterRender.value++;
      }
      
      // Apply position overrides before each render
      if (event === SceneRenderEvent.BeforeRender) {
        const scene = state.scene.peek();
        if (scene) {
          const overrides = visualEditorState.overrides.peek();
          overrides.forEach((override, key) => {
            try {
              const node = scene.getNode(key);
              if (node) {
                // Force position override, even if there are animations
                node.position(override.position);
              }
            } catch (e) {
              // Node might not exist anymore, ignore
            }
          });
        }
      }
    }),
  );

  useSignalEffect(() => {
    const {key, payload} = inspection.value;
    if (key === NodeInspectorKey) {
      state.selectedKey.value = payload as string;
    }
  });

  useSignalEffect(() => {
    const nodeKey = state.selectedKey.value;
    const {key, payload} = inspection.peek();

    if (key === NodeInspectorKey && !nodeKey) {
      inspection.value = {key: '', payload: null};
    } else if (payload !== nodeKey) {
      inspection.value = {key: NodeInspectorKey, payload: nodeKey};
    }
  });

  // Load position overrides from scene.meta on mount AND when meta changes (HMR)
  useSignalEffect(() => {
    const scene = state.scene.value;
    if (!scene) return;
    
    const sceneName = scene.name;
    
    // Function to load and apply overrides
    const loadOverrides = () => {
      console.log(`[Visual Editor] Loading overrides for scene: ${sceneName}`);
      
      // Load from scene.meta (meta file)
      const metaData = scene.meta.serialize() as any;
      console.log('[Visual Editor] Meta data:', metaData);
      
      if (metaData.positionOverrides && Array.isArray(metaData.positionOverrides)) {
        console.log(`[Visual Editor] Found ${metaData.positionOverrides.length} overrides in meta file`);
        visualEditorState.fromJSON({ overrides: metaData.positionOverrides });
        
        // Apply overrides to nodes
        setTimeout(() => {
          const currentOverrides = visualEditorState.overrides.peek();
          console.log(`[Visual Editor] Applying ${currentOverrides.size} overrides from meta`);
          currentOverrides.forEach((override, key) => {
            const node = scene.getNode(key);
            if (node) {
              console.log(`[Visual Editor] Applying override to ${key}:`, override.position);
              node.position(override.position);
            } else {
              console.warn(`[Visual Editor] Node not found: ${key}`);
            }
          });
        }, 100);
      } else {
        console.log(`[Visual Editor] No positionOverrides in meta file for scene: ${sceneName}`);
      }
    };
    
    // Load on mount
    loadOverrides();
    
    // Subscribe to meta changes (HMR)
    const subscription = (scene.meta as any).onChanged?.subscribe(() => {
      console.log('[Visual Editor] Meta changed, reloading overrides');
      loadOverrides();
    });
    
    // Cleanup subscription on unmount
    return () => {
      subscription?.();
    };
  });

  // Save position overrides to scene.meta when changed
  useSignalEffect(() => {
    // Watch for changes in overrides
    const overridesData = visualEditorState.overrides.value;
    const scene = state.scene.peek();
    
    // Don't save if we're currently loading (prevents circular updates during HMR)
    if (visualEditorState.getIsLoading()) {
      console.log('[Visual Editor] Skipping save (currently loading)');
      return;
    }
    
    if (scene && overridesData.size > 0) {
      const sceneName = scene.name;
      const data = visualEditorState.toJSON();
      console.log(`[Visual Editor] Saving ${overridesData.size} overrides for scene: ${sceneName}`, data);
      
      // Save to scene.meta (will write to .meta file)
      const currentMeta = scene.meta.serialize();
      console.log('[Visual Editor] Current meta before set:', currentMeta);
      
      const newMeta = {
        ...currentMeta,
        positionOverrides: data.overrides,
      };
      console.log('[Visual Editor] New meta to set:', newMeta);
      
      (scene.meta as any).set(newMeta);
      console.log('[Visual Editor] Called scene.meta.set()');
      
      // Verify the set worked
      const verifyMeta = scene.meta.serialize();
      console.log('[Visual Editor] Meta after set:', verifyMeta);
      console.log('[Visual Editor] Has positionOverrides?', 'positionOverrides' in verifyMeta);
    }
  });

  return (
    <PluginContext.Provider value={state}>{children}</PluginContext.Provider>
  );
}
