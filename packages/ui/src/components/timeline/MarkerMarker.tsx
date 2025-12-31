import styles from './Timeline.module.scss';

import type {Scene, Marker} from '@revideo/core';
import {useApplication, useTimelineContext} from '../../contexts';
import {findAndOpenFirstUserFile, formatDuration} from '../../utils';
import {useState} from 'preact/hooks';

interface MarkerMarkerProps {
  marker: Marker;
  scene: Scene;
}

export function MarkerMarker({marker, scene}: MarkerMarkerProps) {
  const {framesToPercents} = useTimelineContext();
  const {player} = useApplication();
  const [showTooltip, setShowTooltip] = useState(false);

  const markerFrame = scene.firstFrame + scene.playback.secondsToFrames(marker.time);
  const position = framesToPercents(markerFrame);
  
  // Calculate time information
  const markerTimeInSeconds = marker.time;
  const markerTimeFormatted = formatDuration(markerTimeInSeconds);
  const sceneTimeFormatted = formatDuration(marker.time); // Time relative to scene start

  return (
    <div
      className={styles.markerMarker}
      style={{
        left: `${position}%`,
        '--marker-color': marker.color || '#FFA726',
      } as any}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={(e) => {
        // Check if mouse is moving to the tooltip
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (relatedTarget?.closest(`.${styles.markerTooltip}`)) {
          return;
        }
        setShowTooltip(false);
      }}
      onPointerDown={e => {
        e.stopPropagation();
      }}
      onPointerUp={async e => {
        e.stopPropagation();
        if (e.button === 0) {
          // Left click: seek to marker
          player.requestSeek(markerFrame);
        } else if (e.button === 1 && marker.stack) {
          // Middle click: navigate to source
          await findAndOpenFirstUserFile(marker.stack);
        }
      }}
      onDblClick={async e => {
        e.stopPropagation();
        // Double click: navigate to source
        if (marker.stack) {
          await findAndOpenFirstUserFile(marker.stack);
        }
      }}
    >
      <div className={styles.markerMarkerLine} />
      <div className={styles.markerMarkerLabel}>{marker.name}</div>
      {showTooltip && (
        <div 
          className={styles.markerTooltip}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className={styles.markerTooltipName}>{marker.name}</div>
          <div className={styles.markerTooltipInfo}>
            <span className={styles.markerTooltipLabel}>Scene:</span>
            <span className={styles.markerTooltipValue}>{scene.name}</span>
          </div>
          <div className={styles.markerTooltipInfo}>
            <span className={styles.markerTooltipLabel}>Time:</span>
            <span className={styles.markerTooltipValue}>{markerTimeFormatted}</span>
          </div>
          <div className={styles.markerTooltipInfo}>
            <span className={styles.markerTooltipLabel}>Frame:</span>
            <span className={styles.markerTooltipValue}>{markerFrame}</span>
          </div>
        </div>
      )}
    </div>
  );
}
