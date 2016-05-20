import { Option } from './utils';

// It appears that, sometime, the chrome global variable is not correctly initialized
export function tryTo(chromeApis: Array<string>, doIt: (api: any) => void): void {
  const api = chromeApis.reduce((acc, next) => acc && acc[next], chrome);

  if (api) {
    doIt(api);
  } else {
    location.reload(true);
  }
}

export function getLastError(): Option<any> {
  return Option.wrap(chrome && chrome.runtime && chrome.runtime.lastError);
}
