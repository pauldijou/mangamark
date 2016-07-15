import { Storage, ParsedManga, ParsedChapter } from './types';
import { tryTo } from './chrome';

type MessageType
  = 'debug'
  | 'storage_updated'
  | 'get_storage'
  | 'refresh_storage'
  | 'chapter_read'
  | 'manga_read'
  | 'refresh_mangas';

interface Message<T, V> {
  type: MessageType,
  payload: T
}

function send<T, V>(type: MessageType, payload: T, response?: (V) => void): void {
  console.log('sendMessage', type, payload, response);
  tryTo(['runtime', 'sendMessage'], (api) => {
    api({ type, payload }, response);
  });
}

function on<T, V>(type: MessageType, callback: (payload: T, sender: any, response: (V) => void) => void, async = false): void {
  tryTo(['runtime', 'onMessage'], (api) => {
    api.addListener(function (message: Message<T, V>, sender, sendResponse) {
      if (message.type === type) {
        console.log('onMessage', message.type, message.payload);
        callback(message.payload, sender, sendResponse);
      }
      return async;
    });
  });
}

export function sendStorageUpdated(storage: Storage): void {
  send('storage_updated', storage);
}

export function onStorageUpdated(callback: (storage: Storage) => void): void {
  on('storage_updated', callback);
}

export function sendGetStorage(response: (storage: Storage) => void): void {
  send('get_storage', null, response);
}

export function onGetStorage(getter: () => Promise<Storage>): void {
  on('get_storage', (payload, sender, response) => {
    getter().then(response);
  }, true);
}

export function sendRefreshStorage() {
  send('refresh_storage', null);
}

export function onRefreshStorage(refresher) {
  on('refresh_storage', refresher);
}

export function sendMangaRead(manga: ParsedManga): void {
  send('manga_read', manga);
}

export function onMangaRead(callback: (manga: ParsedManga) => void): void {
  on('manga_read', callback)
}

export function sendChapterRead(chapter: ParsedChapter): void {
  send('chapter_read', chapter);
}

export function onChapterRead(callback: (chapter: ParsedChapter) => void): void {
  on('chapter_read', callback)
}

export function sendDebug(...values): void {
  send('debug', values);
}

export function onDebug(callback) {
  on('debug', callback);
}

export function sendRefreshMangas(): void {
  send('refresh_mangas', null);
}

export function onRefreshMangas(callback) {
  on('refresh_mangas', callback);
}
