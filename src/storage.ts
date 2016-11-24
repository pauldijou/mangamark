// import { Promise } from 'es6-shim';
import { ReaderId, Settings, Manga, SyncManga, Storage, SyncStorage, ParsedManga, ParsedChapter } from './types';
import { isEqual, toSync } from './manga';
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

function getKey(manga: { reader: ReaderId, slug: string }): string {
  return 'manga__' + manga.reader + '__' + manga.slug;
}

function isKey(key: string): boolean {
  return key.indexOf('manga__') === 0;
}

function refreshSync(): Promise<SyncStorage> {
  logger.info('Refresh sync storage');
  return new Promise(function (resolve, reject) {
    tryTo(['storage', 'sync'], (api) => {
      api.get(null, function (items: SyncStorage) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        }
        resolve(items);
      });
    })
  });
}

function refreshLocal(): Promise<Storage> {
  logger.info('Refresh local storage');
  return new Promise(function (resolve, reject) {
    tryTo(['storage', 'local'], (api) => {
      api.get(null, function (localStorage: Storage) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        }

        sendStorageUpdated(localStorage);
        resolve(localStorage);
      });
    })
  });
}

function refreshAll(): Promise<Storage> {
  logger.info('Refresh all storages');
  return refreshSync()
    .then(function (sync) {
      return refreshLocal().then(function (local) {
        return { local, sync };
      });
    })
    .then(function (both: { local: Storage, sync: SyncStorage }) {
      return mergeSyncToStorage(both.sync, both.local);
    });
}

export const refresh: () => Promise<Storage> = oneAtATime(refreshAll);

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

// Convert from SyncStorage (the real stuff online) to Storage (the better stuff used inside the extension)
interface NormalizedSyncMangas {
  [propName: string]: SyncManga
}

interface NormalizedSyncStorage {
  settings: Settings,
  mangas: NormalizedSyncMangas
}

export function normalize(syncStorage: SyncStorage): NormalizedSyncStorage {
  const mangas = Object.keys(syncStorage)
    .filter(isKey)
    .reduce((mangas, key) => {
      const manga = syncStorage[key];
      mangas[getKey(manga)] = manga;
      return mangas;
    }, {});

  return {
    settings: syncStorage.settings,
    mangas: mangas
  };
}

function shouldSaveManga(store: Storage, manga: Manga): boolean {
  return getManga(store.mangas, manga.reader, manga.slug)
    .map(m => !isEqual(manga, m))
    .getOrElse(true);
}

interface PatchMangas { local: { [propName: string]: Manga }, sync: NormalizedSyncMangas }

function getEmptyPatch(): PatchMangas {
  return { local: {}, sync: {} };
}

function addToPatch(storage: Storage, manga: Manga, patch: PatchMangas): PatchMangas {
  if (shouldSaveManga(storage, manga)) {
    let key = getKey(manga);
    patch.local[key] = manga;
    patch.sync[key] = toSync(manga);
  }
  return patch;
}

export function saveManga(manga: Manga): void {
  get().then(s => {
    const { local, sync } = addToPatch(s, manga, getEmptyPatch());
    saveToStorage('local', local);
    // saveToStorage('sync', sync);
  });
}

export function saveMangas(mangas: Array<Manga>): void {
  get().then(s => {
    let { local, sync } = mangas.reduce((patch, manga) => {
      return addToPatch(s, manga, patch);
    }, getEmptyPatch());

    saveToStorage('local', local);
    // saveToStorage('sync', sync);
  });
}

function saveSettings(settings: Settings): void {
  saveToStorage('sync', { settings: settings });
}

function saveToStorage(ns: 'sync' | 'local', patch: Object): void {
  logger.info('saveToStorage', ns, patch);
  tryTo(['storage', ns], (api) => {
    api.set(patch);
  });
}

function mergeSyncToStorage(syncStorage: SyncStorage, storage: Storage): Storage {
  const nSyncStorage = normalize(syncStorage);
  return immUpdate(storage, {
    settings: nSyncStorage.settings,
    mangas: storage.mangas.map(manga => {
      const syncManga = nSyncStorage.mangas[getKey(manga)];
      if (syncManga !== undefined) {
        return immUpdate(manga, syncManga);
      }
      return manga;
    })
  });
}

tryTo(['storage', 'onChanged'], (api) => {
  api.addListener(function(changes, ns) {
    logger.info('storage changed', ns, changes);
    if (ns === 'sync') {
      refreshAll();
    } else if (ns === 'local') {
      refreshLocal();
    }
  });
})
