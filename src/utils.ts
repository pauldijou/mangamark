import { parse } from 'url';
import { Html, Storage, ReaderId, Manga, Chapter, ParsedManga, ParsedChapter } from './types';

export function assign<T>(src: T, patch: Object): T {
  return (<any>Object).assign(src, patch);
}

export function immUpdate<T>(src: T, patch: Object): T {
  return (<any>Object).assign({}, src, patch);
}

export function urlToLocation(url: string): Location {
  const loc = parse(url);
  return {
    href: loc.href,
    protocol: loc.protocol,
    host: loc.host,
    hostname: loc.hostname,
    port: loc.port,
    pathname: loc.pathname,
    search: loc.search,
    hash: loc.hash || '',
    origin: '',
    assign: function (url: string): void {},
    reload: function (forcedReload?: boolean): void {},
    replace: function (url: string): void {},
    toString: function (): string { return url; }
  };
}

export function htmlToDocument(html: Html): Document {
  const doc = document.implementation.createHTMLDocument('');
  doc.body.innerHTML = html;
  return doc;
}

export function isBackground() {
  return location && location.href && location.href.indexOf('background') > 0;
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
        chapters: parsed.chapters.length === 0 ? manga.chapters : parsed.chapters,
      });
    }).getOrElse({
      name: parsed.name,
      slug: parsed.slug,
      lastChapter: parsed.chapters[parsed.chapters.length - 1],
      reader: parsed.reader,
      lastRead: new Date(0).toISOString(),
      chapters: parsed.chapters,
      collapsed: false,
    });
}

// Same as updateManga but with a chapter number which will be used only if greater than the last chapter
// !! Do not save it in the online storage !!
export function updateChapter(mangas: Array<Manga>, parsed: ParsedChapter): Manga {
  const chapter: Chapter = { name: parsed.name, slug: parsed.slug, number: parsed.number };

  return getManga(mangas, parsed.manga.reader, parsed.manga.slug)
    .map(function (manga) {
      const hasChapter: boolean = manga.chapters.reduce((res, chap) => {
        return res || (chap.slug === chapter.slug);
      }, false);
      const lastChapter: Chapter = manga.lastChapter.number < chapter.number ? chapter : manga.lastChapter;

      return immUpdate(manga, {
        lastChapter: lastChapter,
        lastRead: manga.lastChapter === chapter ? new Date().toISOString() : manga.lastRead,
      });
    }).getOrElse({
      name: parsed.name,
      slug: parsed.slug,
      lastChapter: chapter,
      reader: parsed.manga.reader,
      lastRead: new Date(0).toISOString(),
      chapters: [ chapter ],
      collapsed: false,
    });
}

export function oneAtATime<A>(fn: () => Promise<A>, onStart = function () {}, onEnd = function () {}): () => Promise<A> {
  var doingIt = false;
  var oneMoreTime = false;

  function doIt() {
    doingIt = true;
    oneMoreTime = false;
    return fn().then(result => {
      if (oneMoreTime) { return doIt(); }

      doingIt = false;
      onEnd();
      return result;
    }).catch(err => {
      doingIt = false;
      onEnd();
      throw err;
    });
  }

  return function () {
    if (doingIt) {
      oneMoreTime = true;
    } else {
      onStart();
      return doIt();
    }
  }
}

export abstract class Option<T> {
  static wrap<T>(value: T | null | undefined): Option<T> {
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
