import { Manga, ReaderId, ParsedManga, ParsedChapter, ParsedPage } from '../types';
import { assign, htmlToDocument, urlToLocation } from '../utils';

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
    return this.getChapterUrl(manga.slug, manga.lastChapter.number);
  }

  abstract parseManga(doc: Document, location?: Location): Promise<ParsedManga>;
  abstract parseChapter(doc: Document, location?: Location): Promise<ParsedChapter>;
  abstract parsePage(doc: Document, location?: Location): Promise<ParsedPage>;

  fetchAndParse<A>(url: string, parser: (doc: Document, location?: Location) => Promise<A>): Promise<A> {
    return window.fetch(url)
      .then(response => response.text())
      .then(htmlToDocument)
      .then(doc => parser(doc, urlToLocation(url)));
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
    return parsedChapter.name.length >= 0
      && parsedChapter.slug.length > 0
      && parsedChapter.number > 0
      && parsedChapter.manga.name.length > 0
      && parsedChapter.manga.slug.length > 0
      && parsedChapter.pages.length > 0;
  }

  // Init the chapter page, hiding unwanted elements
  // and creating the container for rendering mangamark stuff (returns it in the Promise)
  abstract initChapter(doc: Document): Promise<HTMLElement>;
}

export default Reader;
