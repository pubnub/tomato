export enum LogLevel {
  trace = 10,
  debug = 20,
  info = 30,
  warn = 40,
  error = 50,
  fatal = 60,
  silent = Infinity,
}

export const colorMap = {
  [LogLevel.trace]: 'dim',
  [LogLevel.debug]: 'dim',
  [LogLevel.info]: 'reset',
  [LogLevel.warn]: 'yellow',
  [LogLevel.error]: 'red',
  [LogLevel.fatal]: 'red',
}

export function levelToString(level: LogLevel) {
  return LogLevel[level]
}

export function stringToLevel(level: string) {
  return LogLevel[level]
}
