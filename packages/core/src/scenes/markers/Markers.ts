import {EventDispatcher, ValueDispatcher} from '../../events';
import type {Logger} from '../../app';
import type {Marker} from './Marker';
import type {SerializedMarker} from './SerializedMarker';

/**
 * Manages markers for a scene.
 */
export class Markers {
  public get onChanged() {
    return this.markers.subscribable;
  }

  private readonly markers = new ValueDispatcher<Marker[]>([]);
  private readonly lookup = new Map<string, Marker>();

  public constructor(private readonly logger: Logger) {}

  /**
   * Add a marker at the specified time.
   * 
   * @param name - The name of the marker.
   * @param time - The time in seconds at which to place the marker.
   * @param color - Optional color for the marker.
   * @param stack - Optional stack trace for navigation.
   */
  public add(name: string, time: number, color?: string, stack?: string): void {
    const existing = this.lookup.get(name);
    if (
      existing &&
      existing.time === time &&
      existing.color === color &&
      existing.stack === stack
    ) {
      return;
    }

    const marker: Marker = {
      name,
      time,
      color,
      stack,
    };

    this.lookup.set(name, marker);
    this.markers.current = Array.from(this.lookup.values()).sort(
      (a, b) => a.time - b.time,
    );
  }

  /**
   * Remove a marker by name.
   * 
   * @param name - The name of the marker to remove.
   */
  public remove(name: string): void {
    if (this.lookup.delete(name)) {
      this.markers.current = Array.from(this.lookup.values()).sort(
        (a, b) => a.time - b.time,
      );
    }
  }

  /**
   * Update the time of an existing marker.
   * 
   * @param name - The name of the marker to update.
   * @param time - The new time in seconds.
   */
  public updateTime(name: string, time: number): void {
    const marker = this.lookup.get(name);
    if (marker) {
      marker.time = time;
      this.markers.current = Array.from(this.lookup.values()).sort(
        (a, b) => a.time - b.time,
      );
    }
  }

  /**
   * Get all markers sorted by time.
   */
  public getAll(): Marker[] {
    return this.markers.current;
  }

  /**
   * Get a marker by name.
   * 
   * @param name - The name of the marker.
   */
  public get(name: string): Marker | undefined {
    return this.lookup.get(name);
  }

  /**
   * Clear all markers.
   */
  public clear(): void {
    this.lookup.clear();
    this.markers.current = [];
  }

  /**
   * Serialize markers for storage.
   */
  public serialize(): SerializedMarker[] {
    return this.markers.current.map(marker => ({
      name: marker.name,
      time: marker.time,
      color: marker.color,
    }));
  }

  /**
   * Deserialize markers from storage.
   * 
   * @param data - The serialized marker data.
   */
  public deserialize(data: SerializedMarker[]): void {
    this.clear();
    for (const item of data) {
      this.add(item.name, item.time, item.color);
    }
  }
}
