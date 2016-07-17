import chalk = require('chalk');
import { ReaderId, Settings, Manga, StoredManga, Storage, RawStorage, ParsedManga, ParsedChapter } from './types';
import { isEqual, fromStorage, toStorage } from './manga';
import { sendStorageUpdated, onGetStorage, onRefreshStorage, onMangaRead, onChapterRead } from './messages';
import { immUpdate, isBackground, oneAtATime, Option, Some, None, updateManga, updateChapter, getManga } from './utils';
import { defaultSettings } from './settings';
import { tryTo } from './chrome';
import { createLogger } from './connect';

const logger = createLogger('storage', '#27ae60');
logger.info('init');

if (!isBackground()) {
  logger.warn('Storage has been imported. If this is not the background task, please consider using messaging with response to have only one storage instance.');
}

// Refresh the whole storage
// Will prevent two refresh to run at the same time
function doRefresh(): Promise<Storage> {
  logger.info('Refresh storage');
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
  logger.info('Set storage', newStorage);
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

function shouldSaveManga(store: Storage, manga: Manga): boolean {
  return getManga(store.mangas, manga.reader, manga.slug)
    .map(m => !isEqual(manga, m))
    .getOrElse(true);
}

export function saveManga(manga: Manga): void {
  get().then(s => {
    if (shouldSaveManga(s, manga)) {
      saveToStorage({ [manga.id]: toStorage(manga) });
    }
  });
}

export function saveMangas(mangas: Array<Manga>): void {
  get().then(s => {
    saveToStorage(mangas.reduce((patch, manga) => {
      if (shouldSaveManga(s, manga)) {
        patch[manga.id] = toStorage(manga);
      }
      return patch;
    }, {}));
  });
}

function saveSettings(settings: Settings): void {
  saveToStorage({ settings: settings });
}

function saveToStorage(patch: Object): void {
  logger.info('saveToStorage', patch);
  tryTo(['storage', 'sync'], (api) => {
    api.set(patch);
  });
}

tryTo(['storage', 'onChanged'], (api) => {
  api.addListener(function(changes, ns) {
    logger.info('storage changed', ns, JSON.stringify(changes));
    if (ns === 'sync') {
      refresh();
    }
  });
})
