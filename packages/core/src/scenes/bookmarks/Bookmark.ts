/**
 * Represents a bookmark at runtime.
 */
export interface Bookmark {
  /**
   * Name of the bookmark.
   */
  name: string;
  
  /**
   * Time in seconds at which the bookmark is placed.
   */
  time: number;
  
  /**
   * Optional color for the bookmark marker.
   */
  color?: string;
  
  /**
   * Optional stack trace for navigation to source.
   */
  stack?: string;
}
