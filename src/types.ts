export type ReaderId = 'mangareader' | 'mangafox';

// Global settigns for the extension
export interface Settings {
  // Interval in ms between automatic refresh of all mangas
  interval: number
}

export interface Chapter {
  name: string,
  slug: string,
  number: number
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

// A subtset of manga we want to sync accros devices
// but cannot be too big (no chapter list for example)
export interface SyncManga {
  reader: ReaderId, // 20
  slug: string, // 100
  lastChapter: string, // 15
  lastRead: string, // 32
  collapsed: boolean // 14
}

// The full raw object stored and synched inside chrome.storage.sync
//
export interface SyncStorage {
  settings?: Settings,
  [propName: string]: any | undefined
}

export interface LocalStorage {
  settings?: Settings,
  mangas?: Array<Manga>
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
  number: number,
  manga: {
    name: string,
    reader: ReaderId,
    slug: string
  },
  chapters: Array<Chapter>,
  pages: Array<string>
}

export interface ParsedPage {
  url: string,
  width: number,
  height: number,
  isLarge: boolean
}
