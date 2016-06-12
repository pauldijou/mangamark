import * as snabbdom from 'snabbdom';
import snabbdomClass = require('snabbdom/modules/class');
import snabbdomStyle = require('snabbdom/modules/style');
import snabbdomEvents = require('snabbdom/modules/eventlisteners');
import h = require('snabbdom/h');

import { Storage, ParsedChapter, ParsedManga } from '../types';
import { sendDebug, onStorageUpdated, sendGetStorage } from '../messages';
import { all } from '../readers';
import Reader from '../readers/Reader';
import { Option } from '../utils';
import { tryTo } from '../chrome';

const container = document.createElement('div');
document.body.appendChild(container);

const patch = snabbdom.init([
  snabbdomClass,
  snabbdomStyle,
  snabbdomEvents
]);

let ui: SnabbdomElement = patch(container, renderEmpty());

const doIt = (reader: Reader) => (storage: Storage) => {
  console.log('DO IT', location.pathname, reader.isChapterUrl(location.pathname, document), reader.isMangaUrl(location.pathname, document));
  if (reader.isChapterUrl(location.pathname, document)) {
    reader.parseChapter(location.pathname, document).then(chapter => {
      if (reader.isValidParsedChapter(chapter)) {
        sendDebug('Chapter read from', reader.id, JSON.stringify(chapter));
        handleChapter(reader, storage, chapter);
      }
    });
  } else if (reader.isMangaUrl(location.pathname, document)) {
    reader.parseManga(location.pathname, document).then(manga => {
      if (reader.isValidParsedManga(manga)) {
        sendDebug('Manga read from', reader.id, JSON.stringify(manga));
      }
    });
  }
};

function renderEmpty() {
  return h('div', {}, []);
}

function renderChapter(chapter: ParsedChapter) {
  return h('div#mangamark.chapter', {}, [

  ]);
}

function handleChapter(reader: Reader, storage: Storage, chapter: ParsedChapter): void {
  ui = patch(ui, renderChapter(chapter));
}

Option
  .wrap(all.filter(reader => reader.matchUrl(location.href))[0])
  .map(reader => {
    const letsDoIt = doIt(reader);
    sendGetStorage(letsDoIt);
    onStorageUpdated(letsDoIt);
  });
