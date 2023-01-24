export type Constructor<T, AS extends any[] = any[]> = { new (...args: AS): T }
export type Token<T = any> = Constructor<T> | symbol | string

export type RegistrationDetails<T> = {
  ctor: Constructor<T> | null
}

export type Registration<T> = {
  singleton?: boolean

  as?: Token
  factory?: () => Promise<T>
  inject?: Token[]
}
