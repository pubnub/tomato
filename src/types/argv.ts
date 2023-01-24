export type VerifyCommandArgv = {
  command: 'verify'
  contracts: string
  openapi?: string | string[]
}

export type RunCommandArgv = {
  command: 'run'
  script: string
}

export type UnknownCommandArgv = {
  command: 'unknown'
}

export type Argv = VerifyCommandArgv | RunCommandArgv | UnknownCommandArgv
export const Argv = Symbol('argv')
