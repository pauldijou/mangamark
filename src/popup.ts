// import { load } from 'cheerio';
import * as snabbdom from 'snabbdom';
import snabbdomClass = require('snabbdom/modules/class');
import snabbdomStyle = require('snabbdom/modules/style');
import snabbdomEvents = require('snabbdom/modules/eventlisteners');
import h = require('snabbdom/h');

import start from './start';
import { onStorageUpdated } from './messages';
import { get as getStorage } from './storage';
import { Manga, Storage } from './types';

console.log('LOAD POPUP.JS');

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
    console.log('onStorageUpdate', storage);
    popup = update(patch, popup, storage);
  });
});

function renderManga(manga: Manga): SnabbdomElement {
  return h('li', {}, manga.name);
}

function render(storage: Storage): SnabbdomElement {
  return h('div', {}, [
    h('button', { type: 'button', on: { click: openOptions } }, 'Options'),
    h('div', {}, `You have ${storage.mangas.length} mangas`),
    h('ul', {}, storage.mangas.map(renderManga))
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
    window.open(chrome.runtime.getURL('options/options.html'));
  }
}
