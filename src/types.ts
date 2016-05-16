export type ReaderId = 'mangareader' | 'mangafox';

export interface Settings {
  interval: number
}

export interface Manga {
  id: number,
  name: string,
  slug: string,
  lastChapter: number,
  totalChapters: number,
  reader: ReaderId,
  lastRead: number
}

export interface StoredManga {
  i: number,
  n: string,
  s: string,
  lc: number,
  tc: number,
  r: ReaderId,
  lr: number
}

export interface RawStorage {
  version: number,
  settings: Settings,
  [propName: number]: StoredManga
}

export interface Storage {
  version: number,
  settings: Settings,
  mangas: Array<Manga>
}

export type Html = string;

export interface ParsedManga {
  reader: ReaderId,
  name: string,
  slug: string,
  total: number,
}

export interface ParsedChapter extends ParsedManga {
  chapter: number,
  pages: Array<string>
}
