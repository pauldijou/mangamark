import { init as initSnabbdom, h, attributes, classList, events, SnabbdomElement } from '../snabbdom';
import { onStorageUpdated, sendGetStorage, sendRefreshMangas } from '../messages';
import { Manga, Storage } from '../types';
import { compare } from '../manga';
import { tryTo } from '../chrome';
import { createLogger } from '../logger';
import { goToChapter } from '../utils';
import i18n from '../i18n';

const logger = createLogger('popup', '#2c3e50');
const container = document.getElementById('mangamark-popup');

if (!container) {
  throw new Error('Cannot render content without a container')
}

let popup: SnabbdomElement;

sendGetStorage(init);

function init(storage: Storage) {
  logger.info('init', storage);
  const patch = initSnabbdom([
    attributes,
    classList,
    events
  ]);

  popup = patch(container || document.body, render(storage));

  onStorageUpdated(function (storage: Storage) {
    popup = update(patch, popup, storage);
  });
}

function renderMenu(): SnabbdomElement {
  return h('div.menu', {}, [
    h('h1', {}, i18n.name),
    h('button', { type: 'button', on: { click: openOptions } }, i18n.options),
    h('button', { type: 'button', on: { click: refreshMangas } }, i18n.refresh),
  ]);
}

function renderManga(manga: Manga): SnabbdomElement {
  const options = manga.chapters.reverse().map(chap =>
    h('option', { attrs: { value: chap.number, selected: chap.number === manga.lastChapter.number } }, chap.number + ' - ' + chap.name)
  );

  return h('tr', {}, [
    h('td.name', {}, manga.name),
    h('td.total', {}, manga.lastChapter.number + '/' + manga.chapters.length),
    h('td.select', {}, [
      options.length > 0 ? h('select', { on: { change: goToChapter(manga) } }, options) : h('div', {}, [])
    ]),
  ]);
}

function renderMangas(mangas: Array<Manga>): SnabbdomElement {
  if (mangas.length === 0) {
    return h('div.empty', {}, 'You don\'t have any manga yet');
  }

  return h('table.mangas', {}, mangas.sort(compare).map(renderManga));
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
