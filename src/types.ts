export type ReaderId = 'mangareader' | 'mangafox';

// Global settigns for the extension
export interface Settings {
  // Interval in ms between automatic refresh of all mangas
  interval: number
}

export interface Chapter {
  name: string,
  slug: string
}

// All informations we save about a given manga
export interface Manga {
  reader: ReaderId,
  slug: string,
  name: string,
  chapters: Chapter[],
  lastChapter: Chapter,
  lastRead: string,
  collapsed: boolean
}

// The same as Manga but with smaller keys to save some bytes on online storage
export interface SyncManga {
  reader: ReaderId, // 20
  slug: string, // 100
  lastChapter: string, // 15
  lastRead: string, // 32
  collapsed: boolean // 14
}

// The full raw object stored and synched inside chrome.storage.sync
export interface SyncStorage {
  settings: Settings,
  [propName: number]: SyncManga
}

// The storage representation used inside the extension,
// it's a normalized version of SyncStorage
export interface Storage {
  settings: Settings,
  mangas: Array<Manga>
}

export type Html = string;

// The result of parsing an HTML page from a reader concerning the page describing a manga
export interface ParsedManga {
  reader: ReaderId,
  name: string,
  slug: string,
  chapters: Array<Chapter>,
}

// The result of parsing an HTML page from a reader concerning one particular chapter
export interface ParsedChapter {
  name: string,
  slug: string,
  manga: ParsedManga,
  pages: Array<string>
}

export interface ParsedPage {
  url: string,
  width: number,
  height: number,
  isLarge: boolean
}
