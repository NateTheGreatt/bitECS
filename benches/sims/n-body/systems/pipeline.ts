import { pipe } from '@bitecs/classic';
import { setInitial } from './setInitial';
import { updateGravity } from './updateGravity';
import { moveBodies } from './moveBodies';
import { updateColor } from './updateColor';
import { updateTime } from './time';

export const pipeline = pipe(updateTime, setInitial, updateGravity, moveBodies, updateColor);
