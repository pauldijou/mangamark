export function log(...values: Array<any>): void {
  console.log.apply(console, values);
  if (chrome && chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon38.png'),
      title: 'Debug',
      message: values.map(function (v) { return v.toString() }).join(', ')
    });
  }
}
