import { init as initSnabbdom, h, attributes, classList, events, SnabbdomElement } from '../snabbdom';
import { Storage, ParsedManga, ParsedChapter, ParsedPage } from '../types';
import { onStorageUpdated, sendGetStorage, sendChapterRead, sendMangaRead } from '../messages';
import { all } from '../readers';
import Reader from '../readers/Reader';
import { Option, getManga } from '../utils';
import { tryTo } from '../chrome';
import { createLogger } from '../logger';

const logger = createLogger('content', '#2980b9');
logger.info('init');

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

const renderEvent = new Event('render');

Option
  .wrap(all.filter(reader => reader.matchUrl(location.href))[0])
  .map(init);

function init(reader: Reader) {
  logger.info('Location', location.pathname)
  logger.info('isChapterUrl?', reader.isChapterUrl(document), 'isMangaUrl?', reader.isMangaUrl(document));

  if (reader.isChapterUrl(document)) {
    reader.parseChapter(document).then(chapter => {
      if (reader.isValidParsedChapter(chapter)) {
        logger.info('Chapter read from', reader.id, chapter);
        initChapter(reader, chapter);
        sendChapterRead(chapter);
      }
    });
  } else if (reader.isMangaUrl(document)) {
    reader.parseManga(document).then(manga => {
      if (reader.isValidParsedManga(manga)) {
        logger.info('Manga read from', reader.id, manga);
      }
    });
  }
}

const onKeyDown = (reader, chapter) => (e) => {
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
}

const fetchPage = (reader, chapter, pages) => (page) => {
  const idx = pages.indexOf(page);
  logger.info('fetchPage', idx, page);
  reader.fetchPage(chapter.slug, chapter.chapter, page.name).then(page => {
    pages[idx].value = Option.wrap(page);
    document.dispatchEvent(renderEvent);
  }).catch(error => {
    pages[idx].failed = true;
    document.dispatchEvent(renderEvent);
  });
}

function previousChapter(reader: Reader, chapter: ParsedChapter) {
  return function () {
    window.location.href = reader.getChapterUrl(chapter.slug, chapter.number - 1);
  }
}

function nextChapter(reader: Reader, chapter: ParsedChapter) {
  return function () {
    window.location.href = reader.getChapterUrl(chapter.slug, chapter.number + 1);
  }
}

function goToChapter(reader: Reader, chapter: ParsedChapter) {
  return function (event) {
    window.location.href = reader.getChapterUrl(chapter.slug, parseInt(event.target.value, 10));
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

function renderSelectChapter(reader: Reader, chapter: ParsedChapter): SnabbdomElement {
  return h(
    'select',
    { on: { change: goToChapter(reader, chapter) } },
    []
    // chapter.chapters.map(chap => h('option', { attrs: { value: chap.number, selected: chap.number === chapter.chapter } }, chap.name))
  );
}

function renderFooter(reader: Reader, chapter: ParsedChapter, pages: Array<Page>): SnabbdomElement {
  return h('div.footer', {}, [
    h('button', { on: { click: previousChapter(reader, chapter) } }, 'Previous'),
    renderSelectChapter(reader, chapter),
    h('button', { on: { click: nextChapter(reader, chapter) } }, 'Next'),
  ]);
}

function renderChapter(reader: Reader, chapter: ParsedChapter, pages: Array<Page>) {
  return h('div#mangamark.chapter', {}, pages.map(renderPage).concat([ renderFooter(reader, chapter, pages) ]));
}

function initChapter(reader: Reader, chapter: ParsedChapter) {
  let ui: Option<SnabbdomElement> = Option.empty<SnabbdomElement>();

  const pages = chapter.pages.map(page => ({
    failed: false,
    name: page,
    value: Option.empty<ParsedPage>()
  }));

  function patchUI(newUI: SnabbdomElement) {
    ui = ui.map(u => patch(u, newUI));
  }

  function render(storage: Storage) {
    patchUI(renderChapter(reader, chapter, pages));
  }

  reader.initChapter(document).then(element => {
    ui = Option.wrap(patch(element, renderEmpty()));
  });

  document.addEventListener('keydown', onKeyDown(reader, chapter), true);
  document.addEventListener('render', function () {
    patchUI(renderChapter(reader, chapter, pages));
  }, false);

  const doFetchPage = fetchPage(reader, chapter, pages);
  logger.groupCollapsed('Fetching', pages.length, 'pages');
  pages.forEach(doFetchPage)
  logger.groupEnd();
  sendGetStorage(render);
  onStorageUpdated(render);
}
