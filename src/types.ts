export type ReaderId = 'mangareader' | 'mangafox';

// Global settigns for the extension
export interface Settings {
  // Interval in ms between automatic refresh of all mangas
  interval: number
}

// All informations we save about a give manga
// The id is just a random number to differenciate them
export interface Manga {
  id: number,
  name: string,
  slug: string,
  lastChapter: number,
  totalChapters: number,
  reader: ReaderId,
  lastRead: number
}

// The same as Manga but with smaller keys to save some bytes on online storage
export interface StoredManga {
  i: number,
  n: string,
  s: string,
  lc: number,
  tc: number,
  r: ReaderId,
  lr: number
}

// The full raw object stored and synched inside chrome.storage.sync
export interface RawStorage {
  version: number,
  settings: Settings,
  [propName: number]: StoredManga
}

// The storage representation used inside the extension,
// it's a normalized version of RawStorage
export interface Storage {
  version: number,
  settings: Settings,
  mangas: Array<Manga>
}

export type Html = string;

// The result of parsing an HTML page from a reader concerning the page describing a manga
export interface ParsedManga {
  reader: ReaderId,
  name: string,
  slug: string,
  total: number,
}

// The result of parsing an HTML page from a reader concerning one particular chapter
export interface ParsedChapter extends ParsedManga {
  chapter: number,
  pages: Array<string>
}
