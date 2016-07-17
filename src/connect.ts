import { log, Severity } from './logger';
import { isBackground } from './utils';
import { tryTo } from './chrome';

if (!isBackground()) {
  console && console.warn('Connect has been imported outside of the background task, please consider using messaging with response to have only one onConnect instance.');
}

log({ severity: 'info', prefix: 'connect', 'color': 'blue', at: new Date().toISOString(), values: ['init'] });

tryTo(['runtime', 'onConnect'], api => {
  api.addListener(port => {
    log({ severity: 'info', prefix: 'connect', 'color': 'blue', at: new Date().toISOString(), values: ['onConnect', port.name] });
    if (port.name === 'log') {
      port.onMessage.addListener(log);
    }
  });
});

export function createLogger(prefix: string, color: string) {
  const doLog = (severity: Severity) => (...values) => {
    log({ severity, prefix, color, at: new Date().toISOString(), values });
  }

  return {
    info: doLog('info'),
    warn: doLog('warn'),
    error: doLog('error'),
    group: doLog('group'),
    groupCollapsed: doLog('groupCollapsed'),
    groupEnd: doLog('groupEnd'),
  }
}

export { log } from './logger';
