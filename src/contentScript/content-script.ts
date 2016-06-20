import { init as initSnabbdom, h, attributes, classList, events, SnabbdomElement } from '../snabbdom';
import { Storage, ParsedManga, ParsedChapter, ParsedPage } from '../types';
import { sendDebug, onStorageUpdated, sendGetStorage } from '../messages';
import { all } from '../readers';
import Reader from '../readers/Reader';
import { Option, getManga } from '../utils';
import { tryTo } from '../chrome';

console.log('INIT CONTENT SCRIPT');

interface Page {
  failed: boolean,
  name: string,
  value: Option<ParsedPage>
}

const patch = initSnabbdom([
  attributes,
  classList,
  events,
]);

Option
  .wrap(all.filter(reader => reader.matchUrl(location.href))[0])
  .map(init);

function init(reader: Reader) {
  console.log('INIT', location.pathname, reader.isChapterUrl(document), reader.isMangaUrl(document));
  if (reader.isChapterUrl(document)) {
    reader.parseChapter(document).then(chapter => {
      if (reader.isValidParsedChapter(chapter)) {
        sendDebug('Chapter read from', reader.id, JSON.stringify(chapter));
        initPage(reader, chapter);
      }
    });
  } else if (reader.isMangaUrl(document)) {
    reader.parseManga(document).then(manga => {
      if (reader.isValidParsedManga(manga)) {
        sendDebug('Manga read from', reader.id, JSON.stringify(manga));
      }
    });
  }
}

function initPage(reader: Reader, chapter: ParsedChapter) {
  const container = reader.initPage(document);
  let ui: SnabbdomElement;

  container.then(element => {
    ui = patch(element, renderEmpty());
  });

  document.addEventListener('keydown', function (e) {
    console.log(e);
    const key = e.which || e.keyCode || 0;

    switch (key) {
      case 37: // left arrow
        previousChapter(reader, chapter)();
        e.stopImmediatePropagation();
        break;
      case 39: // right arrow
        nextChapter(reader, chapter)();
        e.stopImmediatePropagation();
        break;
    }
  }, true);

  const pages = chapter.pages.map(page => ({
    failed: false,
    name: page,
    value: Option.empty<ParsedPage>()
  }));

  pages.forEach((page, idx) => {
    reader.fetchPage(chapter.slug, chapter.chapter, page.name).then(page => {
      pages[idx].value = Option.wrap(page);
      ui = patch(ui, renderChapter(reader, chapter, pages));
    }, error => {
      pages[idx].failed = true;
      ui = patch(ui, renderChapter(reader, chapter, pages));
    })
  });

  function render(storage: Storage) {
    container.then(elm => {
      ui = patch(ui, renderChapter(reader, chapter, pages));
    });
  }

  sendGetStorage(render);
  onStorageUpdated(render);
}

function previousChapter(reader: Reader, chapter: ParsedChapter) {
  return function () {
    window.location.href = reader.getChapterUrl(chapter.slug, chapter.chapter - 1);
  }
}

function nextChapter(reader: Reader, chapter: ParsedChapter) {
  return function () {
    window.location.href = reader.getChapterUrl(chapter.slug, chapter.chapter + 1);
  }
}

function renderEmpty() {
  return h('div', {}, []);
}

function renderPage(page: Page): SnabbdomElement {
  const content = [];

  if (page.failed) {
    content.push(h('span', {}, 'Failed to load page ' + page.name));
  } else {
    content.push(page.value.map(v => {
      return h('img', {
        attrs: { src: v.url }
      }, [])
    }).getOrElse(
      h('span', {}, 'Loading...')
    ));
  }

  return h('div.page', {}, content);
}

function renderFooter(reader: Reader, chapter: ParsedChapter): SnabbdomElement {
  return h('div.footer', {}, [
    h('button', { on: { click: previousChapter(reader, chapter) } }, 'Previous'),
    h('button', { on: { click: nextChapter(reader, chapter) } }, 'Next'),
  ]);
}

function renderChapter(reader: Reader, chapter: ParsedChapter, pages: Array<Page>) {
  return h('div#mangamark.chapter', {}, pages.map(renderPage).concat([ renderFooter(reader, chapter) ]));
}
