import { get as getStorage } from './storage';
import { log } from './debug';
import { onDebug, onRefreshMangas } from './messages';
import { oneAtATime } from './utils';

console.log(location);
console.log(location.href);

var refreshing = false;

function doRefreshMangas() {
  console.log('refresh mangas');
  return new Promise(resolve => {
    setTimeout(() => resolve(1), 5000);
  });
}

const refreshMangas = oneAtATime(doRefreshMangas, () => { refreshing = true; }, () => { refreshing = false; });

getStorage().then(storage => {
  console.log('INTERVAL', storage.settings.interval);
});

onDebug((values) => {
  log(...values);
});

onRefreshMangas(refreshMangas);
