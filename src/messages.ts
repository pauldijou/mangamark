import { Storage, ParsedManga, ParsedChapter } from './types';

type MessageType = 'storage_updated' | 'chapter_read' | 'manga_read';

interface Message<T> {
  type: MessageType,
  payload: T
}

function send<T>(type: MessageType, payload: T): void {
  chrome.runtime.sendMessage({ type, payload });
}

function on<T>(type: MessageType, callback: (payload: T) => void): void {
  chrome.runtime.onMessage.addListener(function (message: Message<T>) {
    console.log('onMessage', message);
    if (message.type === type) {
      callback(message.payload);
    }
  });
}

export function sendStorageUpdated(storage: Storage): void {
  send('storage_updated', storage);
}

export function onStorageUpdated(callback: (storage: Storage) => void): void {
  on('storage_updated', callback);
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
