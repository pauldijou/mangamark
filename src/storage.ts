import { ReaderId, Settings, Manga, StoredManga, Storage, RawStorage, ParsedManga, ParsedChapter } from './types';
import { fromStorage } from './manga';
import { sendStorageUpdated } from './messages';
import { log } from './debug';
import { Option, Some, None } from './utils';

let refreshing: boolean = false;
let changedSinceLastRefresh: boolean = false;
let storage: Storage;

function setStorage(newStorage: Storage) {
  log('Set storage', JSON.stringify(newStorage));
  storage = newStorage;
  sendStorageUpdated(storage);
}

// function updateStorage(patch: Object) {
//   const newStorage = (<any>Object).assign({}, storage, patch);
//   Object.keys(newStorage).forEach(function (key) {
//     if (newStorage[key] === undefined || newStorage[key] === null) {
//       delete newStorage[key];
//     }
//   });
//   setStorage(newStorage);
// }

export function get(): Storage {
  return storage;
}

export function refresh(): Promise<Storage> {
  log('Refresh storage');
  changedSinceLastRefresh = false;
  refreshing = true;
  return new Promise(function (resolve, reject) {
    chrome.storage.sync.get(null, function (items: RawStorage) {
      refreshing = false;
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }

      setStorage(normalize(items));
      resolve(changedSinceLastRefresh ? refresh() : storage);
    });
  });
}

function isStoredManga(key: String, item: Settings | StoredManga): item is StoredManga {
  return key.indexOf('m_') === 0 && (<StoredManga>item).i !== undefined;
}

export function normalize(storage: RawStorage): Storage {
  const mangas: Array<Manga> = [];

  Object.keys(storage)
    .forEach(function (key) {
      const item = storage[key];
      if (isStoredManga(key, item)) {
        mangas.push(fromStorage(item));
      }
    });

  return { settings: storage.settings, mangas };
}

export function getManga(reader: ReaderId, slug: string): Option<Manga> {
  return Option.wrap(storage.mangas.filter(function (manga) {
    return manga.reader === reader && manga.slug === slug;
  })[0]);
}

export function updateMangas(mangas: Array<Manga>): Promise<string> {

  return Promise.resolve("");
}

export function updateManga(parsed: ParsedManga): Manga {
  return getManga(parsed.reader, parsed.slug)
    .map(function (manga) {
      manga.totalChapters = parsed.total;
      return manga;
    }).getOrElse({
      id: 0,
      name: '',
      slug: '',
      lastChapter: 0,
      reader: 'mangareader',
      lastRead: 0,
      totalChapters: parsed.total,
    });
}

export function updateChapter(parsed: ParsedChapter): Manga {
  return getManga(parsed.reader, parsed.slug)
    .map(function (manga) {
      return manga;
    }).getOrElse({
      id: 0,
      name: '',
      slug: '',
      lastChapter: 0,
      reader: 'mangareader',
      lastRead: 0,
      totalChapters: parsed.total,
    });
}

chrome.storage.onChanged.addListener(function(changes, ns) {
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
