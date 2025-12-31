import styles from './Timeline.module.scss';

import {useScenes} from '../../hooks';
import {MarkerGroup} from './MarkerGroup';

export function MarkerTrack() {
  const scenes = useScenes();

  return (
    <div className={styles.markerTrack}>
      {scenes.map(scene => (
        <MarkerGroup key={scene.name} scene={scene} />
      ))}
    </div>
  );
}
