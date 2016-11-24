import Reader from './Reader';
import { Option } from '../utils';
import { ReaderId } from '../types';

const id: ReaderId = 'mangareader';

export default class Mangareader extends Reader {
  constructor() {
    super();
    this.id = id;
    this.baseUrl = 'http://www.mangareader.net';
  }

  isMangaUrl(doc: Document): boolean {
    return doc.getElementById('readmangasum') !== null;
  }

  isChapterUrl(doc: Document): boolean {
    return doc.getElementById('topchapter') !== null;
  }

  parseManga(doc: Document, location?: Location) {
    if (!location) { location = doc.location; }

    const [a, slug, ...rest] = location.pathname.split('/');

    const name = Option.wrap(doc.querySelector('h2.aname'))
      .map(h2 => h2.textContent)
      .getOrElse('');

    const chapters = Option.wrap(doc.getElementById('chapterlist'))
      .map(list => list.querySelectorAll('tr > td:first-child'))
      .map(Array.from)
      .map(tds => tds.map(td => ({
        name: td.textContent.split(':').pop().trim(),
        number: Option.wrap(td.querySelector('a'))
          .map(a => a.getAttribute('href'))
          .map(href => href.split('/').pop())
          .map(num => parseInt(num, 10))
          .getOrElse(0)
      })))
      .getOrElse([]);

    return Promise.resolve({ reader: id, name, slug, chapters });
  }

  parseChapter(doc: Document, location?: Location) {
    if (!location) { location = doc.location; }

    return new Promise((resolve, reject) => {
      const menu = doc.getElementById('chapterMenu');

      if (!menu) {
        return reject(0);
      }

      const observer = new MutationObserver((mutations) => {
        observer.disconnect();

        const chapters = [];
        const options = menu.querySelectorAll('option');
        for (let i = 0; i < options.length; ++i) {
          const option = options[i];
          const parts = (option.getAttribute('value') || '').split('/');
          const number = parseInt(parts[parts.length - 1], 10);
          const name = option.textContent;
          chapters.push({ number, name });
        }

        resolve(chapters);
      });

      observer.observe(menu, { childList: true });
    }).then(chapters => {
      const [a, slug, chapter, ...rest] = (location && location.pathname || '').split('/');

      const name = Option.wrap(doc.querySelector('h2.c2'))
        .map(h2 => h2.textContent || '')
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

      return { reader: id, chapters, name, slug, chapter: parseInt(chapter, 10), pages };
    });
  }

  parsePage(doc: Document, location?: Location) {
    const isLarge = Option.wrap(doc.getElementById('zoomer'))
      .map(zoomer => zoomer.textContent || '')
      .map(txt => txt.indexOf('Large') > 0)
      .getOrElse(false);

    const img = Option.wrap(doc.getElementById('img'))
      .map(i => ({
        url: i.getAttribute('src'),
        width: parseInt(i.getAttribute('width') || '0', 10),
        height: parseInt(i.getAttribute('height') || '0', 10),
        isLarge,
      }));

    return Promise.resolve(img.getOrElse({ url: '', width: 0, height: 0, isLarge }));
  }

  initChapter(doc: Document): Promise<HTMLElement> {
    const element = doc.createElement('div');

    ['#adtop', '#adfooter', '#adbottomright'].forEach(sel => {
      Option.wrap(doc.querySelector(sel)).map(e => e.remove());
    });

    ['#topchapter', '#bottomchapter', '#related'].forEach(sel => {
      Option.wrap(doc.querySelector(sel)).map(e => (<HTMLElement>e).style.display = 'none');
    });

    const container = doc.querySelector('#container');
    const content = doc.querySelector('table.episode-table');

    if (container && content) {
      container.replaceChild(element, content);
    }

    return Promise.resolve(element);
  }
}
