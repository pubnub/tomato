import { format } from 'node:util'
import { serializeError } from 'serialize-error'

import { levelToString, LogLevel, stringToLevel } from './log-level.js'
import { isError } from './utils.js'
import { formatter } from './formatter.js'

export type Serializer<I, O> = (data: I) => Record<string, O>
export type LogMethod = (data: any, ...params: any[]) => void

export interface LoggerOptions {
  level: LogLevel

  mixin: Record<string, unknown>
  serializers: Record<string, Serializer<any, any>>

  formatter: (data: Record<string, unknown>) => string
  printer: (data: string) => void
}

export class Logger {
  static defaults: LoggerOptions = {
    level: LogLevel.info,

    mixin: {},
    serializers: {
      err: (error: Error) => serializeError(error),
    },

    formatter: formatter,
    printer: console.log,
  }

  private options: LoggerOptions

  public trace: LogMethod = this.makeLogMethod(LogLevel.trace)
  public debug: LogMethod = this.makeLogMethod(LogLevel.debug)
  public info: LogMethod = this.makeLogMethod(LogLevel.info)
  public warn: LogMethod = this.makeLogMethod(LogLevel.warn)
  public error: LogMethod = this.makeLogMethod(LogLevel.error)
  public fatal: LogMethod = this.makeLogMethod(LogLevel.fatal)
  public success: LogMethod = this.makeLogMethod(LogLevel.info)
  public silent: LogMethod = () => {}

  private makeLogMethod(level: LogLevel) {
    return (...args: Parameters<LogMethod>) => this.log(level, ...args)
  }

  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = Object.assign({}, Logger.defaults, options)
  }

  get level(): string {
    return levelToString(this.options.level)
  }

  set level(level: string) {
    this.options.level = stringToLevel(level)
  }

  child(mixin: Record<string, any>, options: Partial<LoggerOptions> = {}) {
    return new Logger({
      ...this.options,
      ...options,
      mixin: {
        ...this.options.mixin,
        ...mixin,
      },
    })
  }

  private log(level: LogLevel, data: any, ...params: any[]) {
    if (level < this.options.level) {
      return
    }

    if (data === undefined && params.length === 0) {
      return
    }

    const timestamp = new Date().getTime()

    const entry: Record<string, any> = { ...this.options.mixin }

    if (typeof data === 'string') {
      Object.assign(entry, { msg: format(data, ...params) })
    } else {
      const [message, ...rest] = params

      if (message !== undefined) {
        Object.assign(entry, { msg: format(message, ...rest) })
      }

      if (isError(data)) {
        Object.assign(entry, { err: data })
      } else {
        Object.assign(entry, data)
      }
    }

    Object.assign(entry, {
      timestamp,
      level,
    })

    for (const [key, serializer] of Object.entries(this.options.serializers)) {
      if (entry.hasOwnProperty(key)) {
        entry[key] = serializer(entry[key])
      }
    }

    this.options.printer(this.options.formatter(entry))
  }
}

export { LogLevel }
