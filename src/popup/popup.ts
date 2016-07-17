import { init as initSnabbdom, h, attributes, classList, events, SnabbdomElement } from '../snabbdom';
import { onStorageUpdated, sendGetStorage, sendRefreshMangas } from '../messages';
import { Manga, Storage } from '../types';
import { tryTo } from '../chrome';
import { createLogger } from '../logger';

const logger = createLogger('popup', '#2c3e50');
const container = document.getElementById('mangamark-popup');
let popup: SnabbdomElement;

sendGetStorage(init);

function init(storage: Storage) {
  logger.info('init', storage);
  const patch = initSnabbdom([
    attributes,
    classList,
    events
  ]);

  popup = patch(container, render(storage));

  onStorageUpdated(function (storage: Storage) {
    popup = update(patch, popup, storage);
  });
}

function renderMenu(): SnabbdomElement {
  return h('div.menu', {}, [
    h('h1', {}, 'MangaMark'),
    h('button', { type: 'button', on: { click: openOptions } }, 'Options'),
    h('button', { type: 'button', on: { click: refreshMangas } }, 'Refresh'),
  ]);
}

function renderManga(manga: Manga): SnabbdomElement {
  return h('li', {}, manga.name + ': ' + manga.lastChapter + '/' + manga.totalChapters);
}

function renderMangas(mangas: Array<Manga>): SnabbdomElement {
  if (mangas.length === 0) {
    return h('div.empty', {}, 'You don\'t have any manga yet');
  }

  return h('ul', {}, mangas.map(renderManga));
}

function render(storage: Storage): SnabbdomElement {
  logger.info('render', storage);
  return h('div#mangamark-popup', {}, [
    renderMenu(),
    renderMangas(storage.mangas)
  ]);
}

function update(patch: any, previous: SnabbdomElement, storage: Storage): SnabbdomElement {
  const next = render(storage);
  patch(previous, next);
  return next;
}

function openOptions() {
  if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    tryTo(['runtime'], (api) => {
      window.open(api.getURL('options.html'));
    });
  }
}

function refreshMangas() {
  sendRefreshMangas();
}
