import styles from './Timeline.module.scss';

import {useScenes} from '../../hooks';
import {BookmarkGroup} from './BookmarkGroup';

export function BookmarkTrack() {
  const scenes = useScenes();

  return (
    <div className={styles.bookmarkTrack}>
      {scenes.map(scene => (
        <BookmarkGroup key={scene.name} scene={scene} />
      ))}
    </div>
  );
}
