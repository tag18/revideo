import {signal} from '@preact/signals';
import {Vector2} from '@revideo/core';

/**
 * Visual Editor State - stores position overrides for nodes
 * 
 * This allows visual editing of node positions without modifying source code.
 * Position overrides are stored in project meta and persist across sessions.
 */

export interface PositionOverride {
  nodeKey: string;
  position: Vector2;
  timestamp: number;
}

export interface DragState {
  nodeKey: string;
  startPosition: Vector2;
  currentOffset: Vector2;
  isDragging: boolean;
}

class VisualEditorStateManager {
  // Position overrides map: nodeKey -> position
  public overrides = signal<Map<string, PositionOverride>>(new Map());
  
  // Current drag state
  public dragState = signal<DragState | null>(null);
  
  // Visual editor enabled
  public enabled = signal(true);
  
  // Render during drag (performance vs realtime preview)
  public renderDuringDrag = signal(false);
  
  // Flag to prevent save during load (avoid circular updates)
  private isLoading = false;
  
  /**
   * Check if currently loading (to prevent save during load)
   */
  public getIsLoading(): boolean {
    return this.isLoading;
  }
  
  /**
   * Set position override for a node
   */
  public setOverride(nodeKey: string, position: Vector2): void {
    const current = new Map(this.overrides.value);
    current.set(nodeKey, {
      nodeKey,
      position,
      timestamp: Date.now(),
    });
    this.overrides.value = current;
  }
  
  /**
   * Get position override for a node
   */
  public getOverride(nodeKey: string): PositionOverride | undefined {
    return this.overrides.value.get(nodeKey);
  }
  
  /**
   * Remove position override for a node
   */
  public removeOverride(nodeKey: string): void {
    const current = new Map(this.overrides.value);
    current.delete(nodeKey);
    this.overrides.value = current;
  }
  
  /**
   * Clear all position overrides
   */
  public clearAll(): void {
    this.overrides.value = new Map();
  }
  
  /**
   * Start dragging a node
   */
  public startDrag(nodeKey: string, startPosition: Vector2): void {
    this.dragState.value = {
      nodeKey,
      startPosition,
      currentOffset: new Vector2(0, 0),
      isDragging: true,
    };
  }
  
  /**
   * Update drag offset
   */
  public updateDrag(offset: Vector2): void {
    if (this.dragState.value) {
      this.dragState.value = {
        ...this.dragState.value,
        currentOffset: offset,
      };
    }
  }
  
  /**
   * End drag and commit position
   */
  public endDrag(): void {
    const drag = this.dragState.value;
    if (drag) {
      const finalPosition = new Vector2(
        drag.startPosition.x + drag.currentOffset.x,
        drag.startPosition.y + drag.currentOffset.y,
      );
      this.setOverride(drag.nodeKey, finalPosition);
      this.dragState.value = null;
    }
  }
  
  /**
   * Cancel drag
   */
  public cancelDrag(): void {
    this.dragState.value = null;
  }
  
  /**
   * Serialize to JSON for meta storage
   */
  public toJSON(): {overrides: Array<{nodeKey: string; position: {x: number; y: number}; timestamp: number}>} {
    const overrides: Array<{nodeKey: string; position: {x: number; y: number}; timestamp: number}> = [];
    this.overrides.value.forEach((override, key) => {
      overrides.push({
        nodeKey: key,
        position: {
          x: override.position.x,
          y: override.position.y,
        },
        timestamp: override.timestamp,
      });
    });
    return {overrides};
  }
  
  /**
   * Load from JSON meta storage
   */
  public fromJSON(data: {overrides: Array<{nodeKey: string; position: {x: number; y: number}; timestamp: number}>}): void {
    this.isLoading = true;  // Set flag to prevent save
    
    const overrides = new Map<string, PositionOverride>();
    if (data.overrides && Array.isArray(data.overrides)) {
      data.overrides.forEach((item) => {
        if (item && item.nodeKey && item.position) {
          overrides.set(item.nodeKey, {
            nodeKey: item.nodeKey,
            position: new Vector2(item.position.x, item.position.y),
            timestamp: item.timestamp || Date.now(),
          });
        }
      });
    }
    this.overrides.value = overrides;
    
    // Reset flag after a brief delay to allow signals to settle
    setTimeout(() => {
      this.isLoading = false;
    }, 50);
  }
}

// Global singleton instance
export const visualEditorState = new VisualEditorStateManager();
