import Reader from './Reader';
import { Option } from '../utils';

export default class Mangareader extends Reader {
  constructor() {
    super();
    this.id = 'mangareader';
    this.baseUrl = 'http://www.mangareader.net';
  }

  isMangaUrl(pathname: string, doc: Document): boolean {
    return doc.getElementById('readmangasum') !== null;
  }

  isChapterUrl(pathname: string, doc: Document): boolean {
    return doc.getElementById('topchapter') !== null;
  }

  parseManga(pathname: string, doc: Document) {
    return new Promise((resolve, reject) => {
      const [a, slug, ...rest] = pathname.split('/');

      const name = Option.wrap(doc.querySelector('h2.aname'))
        .map(h2 => h2.textContent)
        .getOrElse('');

      const total = Option.wrap(doc.getElementById('chapterlist'))
        .map(list => list.querySelectorAll('tr'))
        .map(trs => trs.length - 1)
        .getOrElse(0);

      resolve({ reader: this.id, name, slug, total });
    });
  }

  parseChapter(pathname: string, doc: Document) {
    return new Promise((resolve, reject) => {
      const menu = doc.getElementById('chapterMenu');

      if (!menu) {
        return resolve(0);
      }

      const observer = new MutationObserver((mutations) => {
        observer.disconnect();
        resolve(menu.querySelectorAll('option').length);
      });

      observer.observe(menu, { childList: true });
    }).then(total => {
      const [a, slug, chapter, ...rest] = pathname.split('/');

      const name = Option.wrap(doc.querySelector('h2.c2'))
        .map(h2 => h2.textContent)
        .map(text => text.replace(/Manga$/, '').trim())
        .getOrElse('');

      const pages = Option.wrap(doc.getElementById('pageMenu'))
        .map(menu => menu.querySelectorAll('option'))
        .map(options => {
          const pages = [];
          for (let i = 0; i < options.length; ++i) {
            pages.push(options[i].textContent);
          }
          return pages;
        })
        .getOrElse([]);

      return { reader: this.id, total, name, slug, chapter: parseInt(chapter, 10), pages };
    });
  }
}
