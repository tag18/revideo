import styles from './Timeline.module.scss';

import type {Scene, Marker} from '@revideo/core';
import {useApplication, useTimelineContext} from '../../contexts';
import {findAndOpenFirstUserFile} from '../../utils';

interface MarkerMarkerProps {
  marker: Marker;
  scene: Scene;
}

export function MarkerMarker({marker, scene}: MarkerMarkerProps) {
  const {framesToPercents} = useTimelineContext();
  const {player} = useApplication();

  const markerFrame = scene.firstFrame + scene.playback.secondsToFrames(marker.time);
  const position = framesToPercents(markerFrame);

  return (
    <div
      className={styles.markerMarker}
      style={{
        left: `${position}%`,
        '--marker-color': marker.color || '#FFA726',
      } as any}
      title={marker.name}
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
    </div>
  );
}
