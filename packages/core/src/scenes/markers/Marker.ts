/**
 * Represents a marker at runtime.
 */
export interface Marker {
  /**
   * Name of the marker.
   */
  name: string;
  
  /**
   * Time in seconds at which the marker is placed.
   */
  time: number;
  
  /**
   * Optional color for the marker.
   */
  color?: string;
  
  /**
   * Optional stack trace for navigation to source.
   */
  stack?: string;
}
