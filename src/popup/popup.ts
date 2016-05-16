import * as snabbdom from 'snabbdom';
import snabbdomClass = require('snabbdom/modules/class');
import snabbdomStyle = require('snabbdom/modules/style');
import snabbdomEvents = require('snabbdom/modules/eventlisteners');
import h = require('snabbdom/h');

import start from '../start';
import { onStorageUpdated } from '../messages';
import { get as getStorage } from '../storage';
import { Manga, Storage } from '../types';
import { log } from '../debug';


const container = document.getElementById('popup');
let popup: SnabbdomElement;

start.then(getStorage).then(function (storage: Storage) {
  const patch = snabbdom.init([
    snabbdomClass,
    snabbdomStyle,
    snabbdomEvents
  ]);

  popup = patch(container, render(storage));

  onStorageUpdated(function (storage: Storage) {
    log('onStorageUpdate', storage);
    popup = update(patch, popup, storage);
  });
});

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
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
}

function refresh() {
  log('Refresh');
}
