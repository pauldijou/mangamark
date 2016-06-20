import { Manga, ReaderId, ParsedManga, ParsedChapter, ParsedPage } from '../types';
import { assign, htmlToDocument } from '../utils';

abstract class Reader {
  id: ReaderId;
  baseUrl: string;

  matchUrl(url: string): boolean {
    return url.indexOf(this.baseUrl) === 0;
  }

  abstract isMangaUrl(doc: Document): boolean
  abstract isChapterUrl(doc: Document): boolean

  getMangaUrl(slug: string): string {
    return this.baseUrl + '/' + slug;
  }

  getChapterUrl(slug: string, chapter: number): string {
    return this.getMangaUrl(slug) + '/' + chapter;
  }

  getPageUrl(slug: string, chapter: number, page: string): string {
    return this.getChapterUrl(slug, chapter) + '/' + page;
  }

  getLastChapterUrl(manga: Manga): string {
    return this.getChapterUrl(manga.slug, manga.lastChapter);
  }

  abstract parseManga(doc: Document): Promise<ParsedManga>;
  abstract parseChapter(doc: Document): Promise<ParsedChapter>;
  abstract parsePage(doc: Document): Promise<ParsedPage>;

  fetchAndParse<A>(url: string, parser: (doc: Document) => Promise<A>): Promise<A> {
    return fetch(url)
      .then(response => response.text())
      .then(htmlToDocument)
      .then(parser);
  }

  fetchManga(slug: string): Promise<ParsedManga> {
    return this.fetchAndParse(this.getMangaUrl(slug), this.parseManga);
  }

  fetchChapter(slug: string, chapter: number): Promise<ParsedChapter> {
    return this.fetchAndParse(this.getChapterUrl(slug, chapter), this.parseChapter);
  }

  fetchPage(slug: string, chapter: number, page: string): Promise<ParsedPage> {
    return this.fetchAndParse(this.getPageUrl(slug, chapter, page), this.parsePage);
  }

  checkManga(manga: Manga): Promise<Manga> {
    return this.fetchManga(manga.slug)
      .then(parsedManga => assign(manga, parsedManga));
  }

  isValidParsedManga(parsedManga: ParsedManga): boolean {
    return parsedManga.name.length > 0
      && parsedManga.slug.length > 0
      && parsedManga.chapters.length > 0;
  }

  isValidParsedChapter(parsedChapter: ParsedChapter): boolean {
    return this.isValidParsedManga(parsedChapter)
      && parsedChapter.chapter > 0
      && parsedChapter.pages.length > 0;
  }

  abstract initPage(doc: Document): Promise<Element>;
}

export default Reader;
