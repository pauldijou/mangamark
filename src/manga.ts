import { ReaderId, Manga, SyncManga, Chapter, ParsedManga, ParsedChapter } from './types';
import { Option, Some, immUpdate } from './utils';

export function toSync(manga: Manga): SyncManga {
  return {
    reader: manga.reader,
    slug: manga.slug,
    lastChapter: manga.lastChapter.number,
    lastRead: manga.lastRead,
    collapsed: manga.collapsed
  }
}

export function merge(local: Manga, sync: SyncManga): Manga {
  if (sync.lastChapter > local.lastChapter.number) {
    local.lastChapter = local.chapters.reduce((res, chap) => {
      if (chap.number === sync.lastChapter) {
        return chap;
      }
      return res;
    }, local.lastChapter);

    if (local.lastChapter.number === sync.lastChapter) {
      local.lastRead = sync.lastRead;
    }
  }

  local.collapsed = sync.collapsed;

  return local;
}

export function fullyRead(manga: Manga): boolean {
  return manga.lastChapter.number >= manga.chapters[manga.chapters.length - 1].number;
}

export function compareNames(n1: string, n2: string): number {
  if (n1 < n2) { return -1; }
  else if (n1 > n2) { return 1; }
  else return 0;
}

export function compare(m1: Manga, m2: Manga): number {
  if (fullyRead(m1)) {
    if (!fullyRead(m2)) { return 1; }
  } else {
    if (fullyRead(m2)) { return -1; }
  }

  return compareNames(m1.name, m2.name);
}

// Return a Manga from king of its primary key
// - the reader where it is read
// - its slug, the unique normalized url portion with its name
export function getManga(mangas: Array<Manga>, reader: ReaderId, slug: string): Option<Manga> {
  return Option.wrap(mangas.filter(function (manga) {
    return manga.reader === reader && manga.slug === slug;
  })[0]);
}

// From a parsed manga page, will try to update a known manga or create a new one if not
// !! Do not save it in the online storage !!
export function updateManga(mangas: Array<Manga>, parsed: ParsedManga): Option<Manga> {
  return getManga(mangas, parsed.reader, parsed.slug)
    .map(function (manga) {
      let updatedManga: Manga | undefined = undefined;

      if (manga.name !== parsed.name) {
        updatedManga = immUpdate(updatedManga || manga, {
          name: parsed.name
        });
      }

      if (parsed.chapters.length > manga.chapters.length) {
        updatedManga = immUpdate(updatedManga || manga, {
          chapters: parsed.chapters
        });
      }

      return Option.wrap<Manga>(updatedManga);
    }).getOrElse(new Some({
      name: parsed.name,
      slug: parsed.slug,
      lastChapter: parsed.chapters[parsed.chapters.length - 1],
      reader: parsed.reader,
      lastRead: new Date().toISOString(),
      chapters: parsed.chapters,
      collapsed: false,
    }));
}

// Same as updateManga but with a chapter number which will be used only if greater than the last chapter
// !! Do not save it in the online storage !!
export function updateChapter(mangas: Array<Manga>, parsed: ParsedChapter): Option<Manga> {
  const chapter: Chapter = { name: parsed.name, slug: parsed.slug, number: parsed.number };

  return getManga(mangas, parsed.manga.reader, parsed.manga.slug)
    .map(function (manga) {
      let updatedManga: Manga | undefined = undefined;

      if (chapter.number > manga.lastChapter.number) {
        updatedManga = immUpdate(updatedManga || manga, {
          lastChapter: chapter,
          lastRead: new Date().toISOString()
        });
      }

      if (parsed.chapters.length > manga.chapters.length) {
        updatedManga = immUpdate(updatedManga || manga, {
          chapters: parsed.chapters
        });
      }

      return Option.wrap<Manga>(updatedManga);
    }).getOrElse(new Some({
      name: parsed.manga.name,
      slug: parsed.manga.slug,
      reader: parsed.manga.reader,
      lastChapter: chapter,
      lastRead: new Date().toISOString(),
      chapters: parsed.chapters,
      collapsed: false,
    }));
}
