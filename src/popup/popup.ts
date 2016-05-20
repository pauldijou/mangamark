import * as snabbdom from 'snabbdom';
import snabbdomClass = require('snabbdom/modules/class');
import snabbdomStyle = require('snabbdom/modules/style');
import snabbdomEvents = require('snabbdom/modules/eventlisteners');
import h = require('snabbdom/h');

import { onStorageUpdated, sendGetStorage } from '../messages';
import { Manga, Storage } from '../types';
import { log } from '../debug';
import { tryTo } from '../chrome';


const container = document.getElementById('popup');
let popup: SnabbdomElement;

sendGetStorage((initStorage) => {
  const patch = snabbdom.init([
    snabbdomClass,
    snabbdomStyle,
    snabbdomEvents
  ]);

  popup = patch(container, render(initStorage));

  onStorageUpdated(function (storage: Storage) {
    log('onStorageUpdate', storage);
    popup = update(patch, popup, storage);
  });
})


function renderMenu(): SnabbdomElement {
  return h('div.menu', {}, [
    h('h1', {}, 'MangaMark'),
    h('button', { type: 'button', on: { click: openOptions } }, 'Options'),
    h('button', { type: 'button', on: { click: refresh } }, 'Refresh'),
  ]);
}

function renderManga(manga: Manga): SnabbdomElement {
  return h('li', {}, manga.name);
}

function renderMangas(mangas: Array<Manga>): SnabbdomElement {
  if (mangas.length === 0) {
    return h('div.empty', {}, 'You don\'t have any manga yet');
  }

  return h('ul', {}, mangas.map(renderManga));
}

function render(storage: Storage): SnabbdomElement {
  return h('div', {}, [
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
    tryTo(['runtime', 'getURL'], (api) => {
      window.open(api.getURL('options.html'));
    });
  }
}

function refresh() {
  log('Refresh');
}
