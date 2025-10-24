import {EventDispatcher, ValueDispatcher} from '../../events';
import type {Logger} from '../../app';
import type {Bookmark} from './Bookmark';
import type {SerializedBookmark} from './SerializedBookmark';

/**
 * Manages bookmarks for a scene.
 */
export class Bookmarks {
  public get onChanged() {
    return this.bookmarks.subscribable;
  }

  private readonly bookmarks = new ValueDispatcher<Bookmark[]>([]);
  private readonly lookup = new Map<string, Bookmark>();

  public constructor(private readonly logger: Logger) {}

  /**
   * Add a bookmark at the specified time.
   * 
   * @param name - The name of the bookmark.
   * @param time - The time in seconds at which to place the bookmark.
   * @param color - Optional color for the bookmark marker.
   * @param stack - Optional stack trace for navigation.
   */
  public add(name: string, time: number, color?: string, stack?: string): void {
    if (this.lookup.has(name)) {
      this.logger.warn(`Bookmark with name "${name}" already exists.`);
      return;
    }

    const bookmark: Bookmark = {
      name,
      time,
      color,
      stack,
    };

    this.lookup.set(name, bookmark);
    this.bookmarks.current = Array.from(this.lookup.values()).sort(
      (a, b) => a.time - b.time,
    );
  }

  /**
   * Remove a bookmark by name.
   * 
   * @param name - The name of the bookmark to remove.
   */
  public remove(name: string): void {
    if (this.lookup.delete(name)) {
      this.bookmarks.current = Array.from(this.lookup.values()).sort(
        (a, b) => a.time - b.time,
      );
    }
  }

  /**
   * Update the time of an existing bookmark.
   * 
   * @param name - The name of the bookmark to update.
   * @param time - The new time in seconds.
   */
  public updateTime(name: string, time: number): void {
    const bookmark = this.lookup.get(name);
    if (bookmark) {
      bookmark.time = time;
      this.bookmarks.current = Array.from(this.lookup.values()).sort(
        (a, b) => a.time - b.time,
      );
    }
  }

  /**
   * Get all bookmarks sorted by time.
   */
  public getAll(): Bookmark[] {
    return this.bookmarks.current;
  }

  /**
   * Get a bookmark by name.
   * 
   * @param name - The name of the bookmark.
   */
  public get(name: string): Bookmark | undefined {
    return this.lookup.get(name);
  }

  /**
   * Clear all bookmarks.
   */
  public clear(): void {
    this.lookup.clear();
    this.bookmarks.current = [];
  }

  /**
   * Serialize bookmarks for storage.
   */
  public serialize(): SerializedBookmark[] {
    return this.bookmarks.current.map(bookmark => ({
      name: bookmark.name,
      time: bookmark.time,
      color: bookmark.color,
    }));
  }

  /**
   * Deserialize bookmarks from storage.
   * 
   * @param data - The serialized bookmark data.
   */
  public deserialize(data: SerializedBookmark[]): void {
    this.clear();
    for (const item of data) {
      this.add(item.name, item.time, item.color);
    }
  }
}
