import Reader from './Reader';
import { Option } from '../utils';

export default class Mangareader extends Reader {
  constructor() {
    super();
    this.id = 'mangareader';
    this.baseUrl = 'http://www.mangareader.net';
  }

  isMangaUrl(doc: Document): boolean {
    return doc.getElementById('readmangasum') !== null;
  }

  isChapterUrl(doc: Document): boolean {
    return doc.getElementById('topchapter') !== null;
  }

  parseManga(doc: Document) {
    const [a, slug, ...rest] = doc.location.pathname.split('/');

    const name = Option.wrap(doc.querySelector('h2.aname'))
      .map(h2 => h2.textContent)
      .getOrElse('');

    const total = Option.wrap(doc.getElementById('chapterlist'))
      .map(list => list.querySelectorAll('tr'))
      .map(trs => trs.length - 1)
      .getOrElse(0);

    return Promise.resolve({ reader: this.id, name, slug, total });
  }

  parseChapter(doc: Document) {
    return new Promise((resolve, reject) => {
      const menu = doc.getElementById('chapterMenu');

      if (!menu) {
        return reject(0);
      }

      const observer = new MutationObserver((mutations) => {
        observer.disconnect();
        resolve(menu.querySelectorAll('option').length);
      });

      observer.observe(menu, { childList: true });
    }).then(total => {
      const [a, slug, chapter, ...rest] = doc.location.pathname.split('/');

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

  parsePage(doc: Document) {
    const isLarge = Option.wrap(doc.getElementById('zoomer'))
      .map(zoomer => zoomer.textContent)
      .map(txt => txt.indexOf('Large') > 0)
      .getOrElse(false);

    const img = Option.wrap(doc.getElementById('img'))
      .map(i => ({
        url: i.getAttribute('src'),
        width: parseInt(i.getAttribute('width'), 10),
        height: parseInt(i.getAttribute('height'), 10),
        isLarge,
      }));

    return Promise.resolve(img.getOrElse({ url: '', width: 0, height: 0, isLarge }));
  }

  initPage(doc: Document) {
    const element = doc.createElement('div');

    ['#adtop', '#topchapter', '#bottomchapter', '#related', '#adfooter', '#adbottomright'].forEach(sel => {
      Option.wrap(doc.querySelector(sel)).map(e => e.remove());
    });

    const container = doc.querySelector('#container');
    const content = doc.querySelector('table.episode-table');

    if (container && content) {
      container.replaceChild(element, content);
    }

    return Promise.resolve(element);
  }
}
