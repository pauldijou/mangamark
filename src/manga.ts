import { ReaderId, Manga, SyncManga } from './types';

export function isEqual(manga1: Manga, manga2: Manga): boolean {
  return manga1 === manga2 || Object.keys(manga1).reduce((acc, key) => {
    return acc && (manga1[key] === manga2[key]);
  }, true);
}

export function toSync(manga: Manga): SyncManga {
  return {
    reader: manga.reader,
    slug: manga.slug,
    lastChapter: manga.lastChapter.slug,
    lastRead: manga.lastRead,
    collapsed: manga.collapsed
  }
}
