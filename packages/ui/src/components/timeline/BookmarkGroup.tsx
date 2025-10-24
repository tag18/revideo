import type {Scene} from '@revideo/core';
import {useTimelineContext} from '../../contexts';
import {useSubscribableValue} from '../../hooks';
import {BookmarkMarker} from './BookmarkMarker';

interface BookmarkGroupProps {
  scene: Scene;
}

export function BookmarkGroup({scene}: BookmarkGroupProps) {
  const {firstVisibleFrame, lastVisibleFrame} = useTimelineContext();
  const bookmarks = useSubscribableValue(scene.bookmarks.onChanged);
  const cached = useSubscribableValue(scene.onCacheChanged);
  const isVisible =
    cached.lastFrame >= firstVisibleFrame &&
    cached.firstFrame <= lastVisibleFrame;

  return (
    <>
      {isVisible &&
        bookmarks.map(bookmark => (
          <BookmarkMarker key={bookmark.name} bookmark={bookmark} scene={scene} />
        ))}
    </>
  );
}
