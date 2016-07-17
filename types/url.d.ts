declare module "url" {
  export interface Url {
    href: string,
    protocol: string,
    host: string,
    auth?: string,
    hostname: string,
    port: string,
    pathname: string,
    search: string,
    path: string,
    // query: string,
    hash?: string
  }

  export function parse(urlStr: string): Url;
  export function format(url: Url): string;
  export function resolve(from: string, to: string): string;
}
