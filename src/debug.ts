export function log(prefix: string, at: string, ...values: Array<any>): void {
  console.log(at, prefix, ...values);
}

export function debug(...values: Array<any>): void {
  // log(...values);
  if (chrome && chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon38.png'),
      title: 'Debug',
      message: values.map(function (v) { return v.toString() }).join(', ')
    });
  }
}
