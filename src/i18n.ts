function translate(name: string, params?: string[]): string {
  return chrome.i18n.getMessage('name', params);
}

const i18n = {
  name: translate('name'),
  description: translate('description'),
  options: translate('options'),
  refresh: translate('refresh'),
  loading: translate('loading'),
  previous: translate('previous'),
  next: translate('next'),

  content: {
    failedPage: (page: string) => translate('failedLoadPage', [ page ])
  }
};

export default i18n;
