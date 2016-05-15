import start from './start';
import { onMangaRead, onChapterRead } from './messages';
import { get as getReader } from './readers';
import { log } from './debug';

log('Load background.js');

start.then(function () {
  log('Loaded background.js');

  onMangaRead(function (manga) {
    const reader = getReader(manga.reader);
    log('MangaRead', manga.reader, manga.slug, manga.total);
  });

  onChapterRead(function (chapter) {
    const reader = getReader(chapter.reader);
    log('ChapterRead', chapter.slug, chapter.chapter, chapter.pages.length);
  });
});
