import { parse } from 'url';
import * as Readers from './readers';
import { Html, Storage, ReaderId, Manga, Chapter, ParsedManga, ParsedChapter, MangaLight } from './types';

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

export function open(url) {
  if (chrome && chrome.tabs && chrome.tabs.getCurrent) {
    chrome.tabs.getCurrent(tab => {
      if (tab === undefined || tab === null) {
        chrome.tabs.create({ url: url, active: true });
      } else {
        chrome.tabs.update({ url: url })
      }
    })
  } else {
    window.location.href = url;
  }
}

export function goToChapter(manga: MangaLight, chapter: number) {
  const reader = Readers.get(manga.reader);
  reader.aside(r => {
    open(r.getChapterUrl(manga.slug, chapter));
  });
}

export function selectChapter(manga: MangaLight) {
  return function (event) {
    goToChapter(manga, parseInt(event.target.value, 10));
  };
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
  abstract aside(mapper: (input: T) => void): Option<T>;
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
  aside(fn) { fn(this.value); return this; }
  getOrElse(alt) { return this.value; }
}


export class None<T> extends Option<T> {
  isDefined() { return false; }
  map(fn) { return none; }
  flatMap(fn) { return none; }
  aside(fn) { return none; }
  getOrElse(alt) { return alt; }
}

const none = new None();
