import styles from './Timeline.module.scss';

import type {Scene, Bookmark} from '@revideo/core';
import {useApplication, useTimelineContext} from '../../contexts';
import {findAndOpenFirstUserFile} from '../../utils';

interface BookmarkMarkerProps {
  bookmark: Bookmark;
  scene: Scene;
}

export function BookmarkMarker({bookmark, scene}: BookmarkMarkerProps) {
  const {framesToPercents} = useTimelineContext();
  const {player} = useApplication();

  const bookmarkFrame = scene.firstFrame + scene.playback.secondsToFrames(bookmark.time);
  const position = framesToPercents(bookmarkFrame);

  return (
    <div
      className={styles.bookmarkMarker}
      style={{
        left: `${position}%`,
        '--bookmark-color': bookmark.color || '#FFA726',
      } as any}
      title={bookmark.name}
      onPointerDown={e => {
        e.stopPropagation();
      }}
      onPointerUp={async e => {
        e.stopPropagation();
        if (e.button === 0) {
          // Left click: seek to bookmark
          player.requestSeek(bookmarkFrame);
        } else if (e.button === 1 && bookmark.stack) {
          // Middle click: navigate to source
          await findAndOpenFirstUserFile(bookmark.stack);
        }
      }}
      onDblClick={async e => {
        e.stopPropagation();
        // Double click: navigate to source
        if (bookmark.stack) {
          await findAndOpenFirstUserFile(bookmark.stack);
        }
      }}
    >
      <div className={styles.bookmarkMarkerLine} />
      <div className={styles.bookmarkMarkerLabel}>{bookmark.name}</div>
    </div>
  );
}
