import { Html, Storage, ReaderId, Manga, ParsedManga, ParsedChapter } from './types';

export function assign<T>(src: T, patch: Object): T {
  return (<any>Object).assign(src, patch);
}

export function immUpdate<T>(src: T, patch: Object): T {
  return (<any>Object).assign({}, src, patch);
}

export function htmlToDocument(html: Html): Document {
  const doc = document.implementation.createHTMLDocument('');
  doc.body.innerHTML = html;
  return doc;
}

function getNextId(mangas: Array<Manga>): number {
  return 1 + mangas.reduce((id, manga) => Math.max(id, manga.id), 0)
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
export function updateManga(mangas: Array<Manga>, parsed: ParsedManga): Manga {
  return getManga(mangas, parsed.reader, parsed.slug)
    .map(function (manga) {
      return immUpdate(manga, {
        totalChapters: parsed.total === 0 ? manga.totalChapters : parsed.total,
      });
    }).getOrElse({
      id: getNextId(mangas),
      name: parsed.name,
      slug: parsed.slug,
      lastChapter: 0,
      reader: parsed.reader,
      lastRead: 0,
      totalChapters: parsed.total,
    });
}

// Same as updateManga but with a chapter number which will be used only if greater than the last chapter
// !! Do not save it in the online storage !!
export function updateChapter(mangas: Array<Manga>, parsed: ParsedChapter): Manga {
  return getManga(mangas, parsed.reader, parsed.slug)
    .map(function (manga) {
      const lastChapter = Math.max(manga.lastChapter, parsed.chapter);
      return immUpdate(manga, {
        lastChapter: lastChapter,
        lastRead: manga.lastChapter < lastChapter ? Date.now() : manga.lastRead,
        totalChapters: parsed.total === 0 ? manga.totalChapters : parsed.total,
      });
    }).getOrElse({
      id: getNextId(mangas),
      name: parsed.name,
      slug: parsed.slug,
      lastChapter: 0,
      reader: parsed.reader,
      lastRead: 0,
      totalChapters: parsed.total,
    });
}

export abstract class Option<T> {
  static wrap<T>(value: T): Option<T> {
    if (value === undefined || value === null) {
      return none;
    } else {
      return new Some(value);
    }
  }

  static empty<T>(): Option<T> {
    return none;
  }

  abstract isDefined(): boolean;
  isEmpty(): boolean { return !this.isDefined(); }
  abstract map<U>(mapper: (input: T) => U): Option<U>;
  abstract flatMap<U>(mapper: (input: T) => Option<U>): Option<U>;
  abstract getOrElse(alt: T): T;
}

export class Some<T> extends Option<T> {
  value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }

  isDefined() { return true; }
  map(fn) { return new Some(fn(this.value)); }
  flatMap(fn) { return fn(this.value); }
  getOrElse(alt) { return this.value; }
}


export class None<T> extends Option<T> {
  isDefined() { return false; }
  map(fn) { return none; }
  flatMap(fn) { return none; }
  getOrElse(alt) { return alt; }
}

const none = new None();
