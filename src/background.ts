import { refresh, get as getStorage } from './storage';
import { log } from './debug';
import { onDebug } from './messages';

refresh();

onDebug((values) => {
  log(...values);
});
