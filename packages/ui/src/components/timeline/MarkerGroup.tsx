import type {Scene} from '@revideo/core';
import {useTimelineContext} from '../../contexts';
import {useSubscribableValue} from '../../hooks';
import {MarkerMarker} from './MarkerMarker';

interface MarkerGroupProps {
  scene: Scene;
}

export function MarkerGroup({scene}: MarkerGroupProps) {
  const {firstVisibleFrame, lastVisibleFrame} = useTimelineContext();
  const markers = useSubscribableValue(scene.markers.onChanged);
  const cached = useSubscribableValue(scene.onCacheChanged);
  const isVisible =
    cached.lastFrame >= firstVisibleFrame &&
    cached.firstFrame <= lastVisibleFrame;

  return (
    <>
      {isVisible &&
        markers.map(marker => (
          <MarkerMarker key={marker.name} marker={marker} scene={scene} />
        ))}
    </>
  );
}
