/**
 * Extended Scene Metadata for Visual Editor Plugin
 * 
 * This extends the core SceneMetadata with position overrides
 */

import {MetaField} from '@revideo/core';

export interface PositionOverrideData {
  nodeKey: string;
  position: {x: number; y: number};
  timestamp: number;
}

/**
 * Add positionOverrides field to scene meta
 * 
 * Usage:
 * ```ts
 * scene.meta.get('positionOverrides') // MetaField<PositionOverrideData[]>
 * ```
 */
export function extendSceneMetadata(meta: any) {
  if (!meta.has('positionOverrides')) {
    meta.add('positionOverrides', new MetaField<PositionOverrideData[]>('positionOverrides', []));
  }
  return meta.get('positionOverrides') as MetaField<PositionOverrideData[]>;
}

/**
 * Get or create positionOverrides field from scene meta
 */
export function getPositionOverridesField(scene: any): MetaField<PositionOverrideData[]> {
  const meta = scene.meta;
  
  // Check if field already exists
  if (meta.has && meta.has('positionOverrides')) {
    return meta.get('positionOverrides');
  }
  
  // Create new field
  const field = new MetaField<PositionOverrideData[]>('positionOverrides', []);
  
  // Try to add it to meta object
  if (meta.add) {
    meta.add('positionOverrides', field);
  }
  
  return field;
}
