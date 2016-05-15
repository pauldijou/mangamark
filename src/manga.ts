import { ReaderId, Manga, StoredManga } from './types';

export function fromStorage(storedManga: StoredManga): Manga {
  return {
    id: storedManga.i,
    name: storedManga.n,
    slug: storedManga.s,
    lastChapter: storedManga.lc,
    totalChapters: storedManga.tc,
    reader: storedManga.r,
    lastRead: storedManga.lr,
  };
}

export function toStorage(manga: Manga): StoredManga {
  return {
    i: manga.id,
    n: manga.name,
    s: manga.slug,
    lc: manga.lastChapter,
    tc: manga.totalChapters,
    r: manga.reader,
    lr: manga.lastRead,
  };
}
