import { Html } from './types';

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
