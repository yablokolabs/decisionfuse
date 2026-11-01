import {Composition} from 'remotion';
import {Main} from './Main';
import {TOTAL_SECONDS} from './storyboard';
import {FPS} from './timing';

export const Root: React.FC = () => (
  <Composition
    id="Video"
    component={Main}
    durationInFrames={Math.ceil(TOTAL_SECONDS * FPS)}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
