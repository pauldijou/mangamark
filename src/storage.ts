import { ReaderId, Settings, Manga, StoredManga, Storage, RawStorage, ParsedManga, ParsedChapter } from './types';
import { fromStorage, toStorage } from './manga';
import { sendStorageUpdated, onGetStorage } from './messages';
import { log } from './debug';
import { immUpdate, Option, Some, None } from './utils';
import { defaultSettings } from './settings';
import { tryTo } from './chrome';

console.warn('Storage has been imported. If this is not the background task, please consider using messaging with response to have only one storage instance.');

// This is a temporary solution to have flags,
// we can do better
let refreshing: boolean = false;
let changedSinceLastRefresh: boolean = false;

// The current storage (should be in sync with chrome.storage.sync)
let storage: Storage;

// Override the current storage and trigger a message to all the extension
function setStorage(newStorage: Storage) {
  log('Set storage', JSON.stringify(newStorage));
  storage = newStorage;
  sendStorageUpdated(storage);
}

// Return the current storage (no kidding)
export function get(): Storage {
  return storage;
}

// This seems like nothing but it's actually responding to any get_storage message
// return the current storage
onGetStorage(get);

// Refresh the whole storage
// Will prevent two refresh to run at the same time
export function refresh(): Promise<Storage> {
  log('Refresh storage');
  changedSinceLastRefresh = false;
  refreshing = true;
  return new Promise(function (resolve, reject) {
    tryTo(['storage', 'sync'], (api) => {
      api.get(null, function (items: RawStorage) {
        refreshing = false;
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        }

        setStorage(normalize(items));
        resolve(changedSinceLastRefresh ? refresh() : storage);
      });
    })
  });
}

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

// Return a Manga from king of its primary key
// - the reader where it is read
// - its slug, the unique normalized url portion with its name
export function getManga(reader: ReaderId, slug: string): Option<Manga> {
  return Option.wrap(storage.mangas.filter(function (manga) {
    return manga.reader === reader && manga.slug === slug;
  })[0]);
}

function getNextId(): number {
  return 1 + storage.mangas.reduce((id, manga) => Math.max(id, manga.id), 0)
}

export function updateMangas(mangas: Array<Manga>): Promise<string> {

  return Promise.resolve("");
}

// From a parsed manga page, will try to update a known manga or create a new one if not
// !! Do not save it in the online storage !!
export function updateManga(parsed: ParsedManga): Manga {
  return getManga(parsed.reader, parsed.slug)
    .map(function (manga) {
      return immUpdate(manga, {
        totalChapters: parsed.total === 0 ? manga.totalChapters : parsed.total,
      });
    }).getOrElse({
      id: getNextId(),
      name: parsed.name,
      slug: parsed.slug,
      lastChapter: 0,
      reader: parsed.reader,
      lastRead: 0,
      totalChapters: parsed.total,
    });
}

// Same as updateManga but with a chapter number which will be used only if greater than the last chapter
// !! Do not save it in the online storage !!
export function updateChapter(parsed: ParsedChapter): Manga {
  return getManga(parsed.reader, parsed.slug)
    .map(function (manga) {
      const lastChapter = Math.max(manga.lastChapter, parsed.chapter);
      return immUpdate(manga, {
        lastChapter: lastChapter,
        lastRead: manga.lastChapter < lastChapter ? Date.now() : manga.lastRead,
        totalChapters: parsed.total === 0 ? manga.totalChapters : parsed.total,
      });
    }).getOrElse({
      id: getNextId(),
      name: parsed.name,
      slug: parsed.slug,
      lastChapter: 0,
      reader: parsed.reader,
      lastRead: 0,
      totalChapters: parsed.total,
    });
}

function saveManga(manga: Manga): void {
  saveToStorage({ [manga.id]: toStorage(manga) });
}

function saveMangas(mangas: Array<Manga>): void {
  saveToStorage(mangas.reduce((patch, manga) => {
    patch[manga.id] = toStorage(manga);
    return patch;
  }, {}));
}

function saveSettings(settings: Settings): void {
  saveToStorage({ settings: settings });
}

function saveToStorage(patch: Object): void {
  tryTo(['storage', 'sync'], (api) => {
    api.set(patch);
  });
}

tryTo(['storage', 'onChanged'], (api) => {
  api.addListener(function(changes, ns) {
    log('storage changed', ns, JSON.stringify(changes));
    if (ns === 'sync') {
      // const patch = Object.keys(changes).reduce(function (acc, key) {
      //   acc[key] = changes[key].newValue;
      //   return acc;
      // }, {});
      // updateStorage(patch);
      if (refreshing) {
        changedSinceLastRefresh = true;
      } else {
        refresh();
      }
    }
  });
})
