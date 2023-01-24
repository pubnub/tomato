export type Logger<Options extends Record<string, any> = any> = {
  level: string

  trace: (data: any, ...params: any[]) => void
  debug: (data: any, ...params: any[]) => void
  info: (data: any, ...params: any[]) => void
  warn: (data: any, ...params: any[]) => void
  error: (data: any, ...params: any[]) => void
  fatal: (data: any, ...params: any[]) => void
  success: (data: any, ...params: any[]) => void
  silent: (data: any, ...params: any[]) => void

  child: (mixin: Record<string, any>, options: Partial<Options>) => Logger<Options>
}

export const Logger = Symbol('logger')
