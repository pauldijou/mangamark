// import { Promise } from 'es6-shim';
import { ReaderId, Settings, Manga, SyncManga, LocalStorage, Storage, SyncStorage, ParsedManga, ParsedChapter } from './types';
import { toSync, updateManga, updateChapter, getManga, merge } from './manga';
import { sendStorageUpdated, onGetStorage, onRefreshStorage, onMangaRead, onChapterRead } from './messages';
import { immUpdate, isBackground, oneAtATime, Option, Some, None } from './utils';
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
      api.get(null, function (localStorage: LocalStorage) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        }

        const storage = {
          settings: localStorage.settings || defaultSettings,
          mangas: localStorage.mangas || []
        }

        resolve(storage);
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

      if (manga) {
        mangas[getKey(manga)] = manga;
      }

      return mangas;
    }, {});

  return {
    settings: syncStorage.settings || defaultSettings,
    mangas: mangas
  };
}

interface PatchMangas { local: { mangas: Array<Manga> }, sync: NormalizedSyncMangas }

function getEmptyPatch(mangas: Array<Manga>): PatchMangas {
  return { local: { mangas }, sync: {} };
}

function addToPatch(storage: Storage, optManga: Option<Manga>, patch: PatchMangas): PatchMangas {
  logger.info('addToPatch', optManga, patch, storage);
  optManga.aside(manga => {
    let key = getKey(manga);
    let found = false;
    patch.local.mangas = patch.local.mangas.map(m => {
      if (m.slug === manga.slug) {
        found = true;
        return manga;
      } else {
        return m;
      }
    });

    if (!found) {
      patch.local.mangas.push(manga);
    }

    patch.sync[key] = toSync(manga);
  })

  return patch;
}

export function saveManga(manga: Option<Manga>): void {
  get().then(s => {
    const { local, sync } = addToPatch(s, manga, getEmptyPatch(s.mangas));
    saveToStorage('local', local);
    saveToStorage('sync', sync);
  });
}

export function saveMangas(mangas: Array<Option<Manga>>): void {
  get().then(s => {
    const { local, sync } = mangas.reduce((patch, manga) => {
      return addToPatch(s, manga, patch);
    }, getEmptyPatch(s.mangas));

    saveToStorage('local', local);
    saveToStorage('sync', sync);
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
        return merge(manga, syncManga);
      }
      return manga;
    })
  });
}

tryTo(['storage', 'onChanged'], (api) => {
  api.addListener(function(changes, ns) {
    logger.info('storage changed', ns, changes);
    if (ns === 'sync') {
      refreshAll().then(setStorage);
    } else if (ns === 'local') {
      refreshLocal().then(setStorage);
    }
  });
})
