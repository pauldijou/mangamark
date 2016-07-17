import { createLogger } from './connect';
import { get as getStorage, saveMangas } from './storage';
import { onRefreshMangas } from './messages';
import { oneAtATime, Option, updateManga } from './utils';
import { Manga } from './types';
import { get as getReader } from './readers';

const logger = createLogger('background', '#c0392b');

var refreshing = false;

const doRefreshManga = (mangas: Manga[]) => (manga: Manga) => {
  return getReader(manga.reader).map(reader =>
    reader
      .fetchManga(manga.slug)
      .then(parsedManga => updateManga(mangas, parsedManga))
      .then(Option.wrap)
      .then(opt => ({ origin: manga, fetched: opt, error: Option.empty() }))
      .catch(err => ({ origin: manga, fetched: Option.empty<Manga>(), error: Option.wrap(err) }))
  ).getOrElse(Promise.resolve({ origin: manga, fetched: Option.empty<Manga>(), error: Option.wrap(new Error('Unknow reader ' + manga.reader)) }));
}

function doRefreshMangas() {
  const start = Date.now();
  return getStorage()
    .then(storage => { logger.info('Refreshing', storage.mangas.length, 'mangas', storage.mangas); return storage.mangas; })
    .then(mangas => Promise.all(mangas.map(doRefreshManga(mangas))))
    .then(fetchedMangas => {
      const mangas: Array<{origin: Manga, fetched: Option<Manga>}> = <any>fetchedMangas;
      const filteredMangas: Array<Manga> = [];
      mangas.filter(d => d.fetched.isDefined()).forEach(d => {
        d.fetched.map(m => { filteredMangas.push(m); })
      });
      logger.info('Refreshed ' + filteredMangas.length + '/' + mangas.length + ' mangas in ' + (Date.now() - start) + 'ms', mangas);
      return filteredMangas;
    })
    .then(saveMangas)
    .catch(err => {
      logger.warn('Failed to refresh mangas');
      logger.error(err);
      throw err;
    });
}

const refreshMangas = oneAtATime(doRefreshMangas, () => { refreshing = true; }, () => { refreshing = false; });

getStorage().then(storage => {
  logger.info('setInterval refresh', storage.settings.interval);
  try { refreshMangas(); }
  catch (e) { console.error(e); }

  setInterval(() => {
    try { refreshMangas(); }
    catch (e) { console.error(e); }
  }, storage.settings.interval);
});

onRefreshMangas(refreshMangas);
