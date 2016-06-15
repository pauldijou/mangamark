import * as snabbdom from 'snabbdom';
import snabbdomAttributes = require('snabbdom/modules/attributes');
import snabbdomClass = require('snabbdom/modules/class');
import snabbdomStyle = require('snabbdom/modules/style');
import snabbdomEvents = require('snabbdom/modules/eventlisteners');
import h = require('snabbdom/h');

import { Storage, ParsedManga, ParsedChapter, ParsedPage } from '../types';
import { sendDebug, onStorageUpdated, sendGetStorage } from '../messages';
import { all } from '../readers';
import Reader from '../readers/Reader';
import { Option, getManga } from '../utils';
import { tryTo } from '../chrome';

console.log('INIT CONTENT SCRIPT');

interface Page {
  loaded: boolean,
  failed: boolean,
  name: string,
  value: Option<ParsedPage>
}

const patch = snabbdom.init([
  snabbdomAttributes,
  snabbdomClass,
  snabbdomStyle,
  snabbdomEvents
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
        window.location.href = reader.getChapterUrl(chapter.slug, chapter.chapter - 1);
        e.stopImmediatePropagation();
        break;
      case 39: // right arrow
        window.location.href = reader.getChapterUrl(chapter.slug, chapter.chapter + 1);
        e.stopImmediatePropagation();
        break;
    }
  }, true);

  const pages = chapter.pages.map(page => ({
    loaded: false,
    failed: false,
    name: page,
    value: Option.empty<ParsedPage>()
  }));

  pages.forEach((page, idx) => {
    reader.fetchPage(chapter.slug, chapter.chapter, page.name).then(page => {
      pages[idx].loaded = true;
      pages[idx].value = Option.wrap(page);
      ui = patch(ui, renderChapter(chapter, pages));
    }, error => {
      pages[idx].loaded = true;
      pages[idx].failed = true;
      ui = patch(ui, renderChapter(chapter, pages));
    })
  });

  function render(storage: Storage) {
    container.then(elm => {
      ui = patch(ui, renderChapter(chapter, pages));
    });
  }

  sendGetStorage(render);
  onStorageUpdated(render);
}

function renderEmpty() {
  return h('div', {}, []);
}

function renderPage(page: Page) {
  return h('div.page', {}, [
    h('img', {
      attrs: { src: page.value.map(p => p.url).getOrElse('') }
    }, [])
  ]);
}

function renderChapter(chapter: ParsedChapter, pages: Array<Page>) {
  return h('div#mangamark.chapter', {}, pages.map(renderPage));
}
