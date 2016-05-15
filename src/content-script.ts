import { sendMangaRead, sendChapterRead } from './messages';
import { all } from './readers';
import { log } from './debug';

console.log('CONTENT SCRIPT');
all.filter(function (reader) {
  return reader.matchUrl(location.href);
}).forEach(function (reader) {
  if (reader.isChapterUrl(location.pathname, document)) {
    log('Send chapter read from', reader.id);
    sendChapterRead(reader.parseChapter(location.pathname, document));
  } else if (reader.isMangaUrl(location.pathname, document)) {
    log('Send manga read from', reader.id);
    sendMangaRead(reader.parseManga(location.pathname, document));
  }
});
