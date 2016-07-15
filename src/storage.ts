import { ReaderId, Settings, Manga, StoredManga, Storage, RawStorage, ParsedManga, ParsedChapter } from './types';
import { isEqual, fromStorage, toStorage } from './manga';
import { sendStorageUpdated, onGetStorage, onRefreshStorage, onMangaRead, onChapterRead } from './messages';
import { log } from './debug';
import { immUpdate, oneAtATime, Option, Some, None, updateManga, updateChapter } from './utils';
import { defaultSettings } from './settings';
import { tryTo } from './chrome';

console.log('STORAGE');

if (!location || !location.href || location.href.indexOf('background') < 0) {
  console && console.warn('Storage has been imported. If this is not the background task, please consider using messaging with response to have only one storage instance.');
}

// Refresh the whole storage
// Will prevent two refresh to run at the same time
function doRefresh(): Promise<Storage> {
  log('Refresh storage');
  return new Promise(function (resolve, reject) {
    tryTo(['storage', 'sync'], (api) => {
      api.get(null, function (items: RawStorage) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        }

        const newStorage = normalize(items);
        setStorage(newStorage);
        resolve(newStorage);
      });
    })
  });
}

export const refresh: () => Promise<Storage> = oneAtATime(doRefresh);

// The current storage (should be in sync with chrome.storage.sync)
let storage: Promise<Storage> = refresh();

// Override the current storage and trigger a message to all the extension
function setStorage(newStorage: Storage) {
  log('Set storage', JSON.stringify(newStorage));
  storage = Promise.resolve(newStorage);
  sendStorageUpdated(newStorage);
}

// Return the current storage (no kidding)
export function get(): Promise<Storage> {
  return storage;
}

// This seems like nothing but it's actually responding to any get_storage message
// return the current storage
onGetStorage(get);
onRefreshStorage(refresh);

// Update data when reading stuff
onMangaRead(manga => storage.then(store => saveManga(updateManga(store.mangas, manga))));
onChapterRead(chapter => storage.then(store => saveManga(updateChapter(store.mangas, chapter))));

// Convert from RawStorage (the real stuff online) to Storage (the better stuff used inside the extension)
export function normalize(rawStorage: RawStorage): Storage {
  const mangas: Array<Manga> = Object.keys(rawStorage)
    .map(key => parseInt(key, 10))
    .filter((<any>Number).isFinite)
    .map(key => rawStorage[key])
    .map(fromStorage);

  return {
    version: rawStorage.version || 0,
    settings: immUpdate(defaultSettings, rawStorage.settings),
    mangas
  };
}

function shouldSaveManga(manga: Manga): boolean {
  return Option
    .wrap(storage)
    .flatMap(s => Option.wrap(s[manga.id]))
    .map(m => !isEqual(manga, m))
    .getOrElse(true);
}

function saveManga(manga: Manga): void {
  if (shouldSaveManga(manga)) {
    saveToStorage({ [manga.id]: toStorage(manga) });
  }
}

function saveMangas(mangas: Array<Manga>): void {
  saveToStorage(mangas.reduce((patch, manga) => {
    if (shouldSaveManga(manga)) {
      patch[manga.id] = toStorage(manga);
    }
    return patch;
  }, {}));
}

function saveSettings(settings: Settings): void {
  saveToStorage({ settings: settings });
}

function saveToStorage(patch: Object): void {
  log('saveToStorage', JSON.stringify(patch));
  tryTo(['storage', 'sync'], (api) => {
    api.set(patch);
  });
}

tryTo(['storage', 'onChanged'], (api) => {
  api.addListener(function(changes, ns) {
    log('storage changed', ns, JSON.stringify(changes));
    if (ns === 'sync') {
      refresh();
    }
  });
})
