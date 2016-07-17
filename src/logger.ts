import { tryTo } from './chrome';

export type Severity = 'info' | 'warn' | 'error' | 'group' | 'groupCollapsed' | 'groupEnd';

export interface LogMsg {
  severity: Severity,
  at: string,
  prefix: string,
  color: string,
  values: Array<any>
}

function postMessage(port, msg: LogMsg) {
  port && port.postMessage(msg);
}

export function createLogger(prefix: string, color: string) {
  let port;

  tryTo(['runtime', 'connect'], api => {
    port = api({ name: 'log' })
  });

  const doLog = (severity: Severity) => (...values) => {
    postMessage(port, { severity, prefix, color, at: new Date().toISOString(), values });
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

export function log(msg: LogMsg) {
  let logger;
  switch (msg.severity) {
    case 'error': logger = console.error; break;
    case 'warn': logger = console.warn; break;
    case 'group': logger = console.group; break;
    case 'groupCollapsed': logger = console.groupCollapsed; break;
    case 'groupEnd': logger = console.groupEnd; break;
    default: logger = console.log;
  }
  logger.call(console, msg.at + ' %c[' + msg.prefix + ']', 'color:' + msg.color, ...msg.values);
}
