import { Storage } from './types';
import { sendDebug, onStorageUpdated, sendGetStorage } from './messages';
import { all } from './readers';
import Reader from './readers/Reader';
import { Option } from './utils';

const doIt = (reader: Reader) => (storage: Storage) => {
  console.log('DO IT', location.pathname, reader.isChapterUrl(location.pathname, document), reader.isMangaUrl(location.pathname, document));
  if (reader.isChapterUrl(location.pathname, document)) {
    const chapter = reader.parseChapter(location.pathname, document);
    if (reader.isValidParsedChapter(chapter)) {
      sendDebug('Chapter read from', reader.id, JSON.stringify(chapter));
    }
  } else if (reader.isMangaUrl(location.pathname, document)) {
    const manga = reader.parseManga(location.pathname, document);
    if (reader.isValidParsedManga(manga)) {
      sendDebug('Manga read from', reader.id, JSON.stringify(manga));
    }
  }
};

Option
  .wrap(all.filter(reader => reader.matchUrl(location.href))[0])
  .map(reader => {
    const letsDoIt = doIt(reader);
    sendGetStorage(letsDoIt);
    onStorageUpdated(letsDoIt);
  });
