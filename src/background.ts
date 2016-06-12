import { refresh, get as getStorage } from './storage';
import { log } from './debug';
import { onDebug } from './messages';

console.log(location);
console.log(location.href);

refresh();

onDebug((values) => {
  log(...values);
});
