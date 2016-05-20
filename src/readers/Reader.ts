import { Manga, ReaderId, ParsedManga, ParsedChapter } from '../types';
import { assign, htmlToDocument } from '../utils';

abstract class Reader {
  id: ReaderId;
  baseUrl: string;

  matchUrl(url: string): boolean {
    return url.indexOf(this.baseUrl) === 0;
  }

  abstract isMangaUrl(pathname: string, doc: Document): boolean
  abstract isChapterUrl(pathname: string, doc: Document): boolean

  getMangaUrl(manga: Manga): string {
    return this.baseUrl + '/' + manga.slug;
  }

  getChapterUrl(manga: Manga, chapter: number): string {
    return this.getMangaUrl(manga) + '/' + chapter;
  }

  getLastChapterUrl(manga: Manga): string {
    return this.getChapterUrl(manga, manga.lastChapter);
  }

  abstract parseManga(pathname: string, doc: Document): ParsedManga;
  abstract parseChapter(pathname: string, doc: Document): ParsedChapter;

  checkManga(manga: Manga): Promise<Manga> {
    return fetch(this.getMangaUrl(manga))
      .then(response => response.text())
      .then(htmlToDocument)
      .then(doc => this.parseManga('', doc))
      .then(parsedManga => assign(manga, parsedManga));
  }

  isValidParsedManga(parsedManga: ParsedManga): boolean {
    return parsedManga.name.length > 0
      && parsedManga.slug.length > 0
      && parsedManga.total > 0;
  }

  isValidParsedChapter(parsedChapter: ParsedChapter): boolean {
    // We will not validate the total chapters for now
    // (looks like it's injected afer dom loaded in mangareader)
    return parsedChapter.name.length > 0
      && parsedChapter.slug.length > 0
      && parsedChapter.chapter > 0
      && parsedChapter.pages.length > 0;
  }
}

export default Reader;
