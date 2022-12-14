import { deepmerge } from 'deepmerge-ts'
import { FileSystem } from '../file-system.js'
import { Logger } from '../logger/index.js'

import { LogLevel, stringToLevel } from '../logger/log-level.js'
import { SettingsFile } from './provider.js'

export interface ServerSettings {
  level: LogLevel

  showDetails: boolean
  enableMetaApi: boolean

  https: boolean

  key: string | undefined
  cert: string | undefined
}

const verbosityLevels = ['info', 'debug', 'trace']

export class Settings {
  public port: number
  public env: Record<string, string>

  public contractsGlobs: string | string[]
  public openApiGlobs?: string | string[]
  public cwd: string

  public level: LogLevel

  public server: ServerSettings

  public watch: boolean

  constructor(...inputs: SettingsFile[]) {
    const settings = deepmerge<SettingsFile[]>({}, ...inputs) as SettingsFile

    this.port = settings.port ?? 8090
    this.env = deepmerge({}, process.env, settings.env ?? {})

    this.contractsGlobs = settings.contracts ?? './contracts/**/*.ts'
    this.openApiGlobs = settings.openapi

    if (settings.cwd) {
      process.chdir(settings.cwd)
    }

    this.cwd = settings.cwd ?? process.cwd()

    this.level = stringToLevel(verbosityLevels[settings.level ?? 0] ?? 'info')

    this.server = {
      level: stringToLevel(settings.server?.level ?? 'info'),
      showDetails: settings.server?.showDetails ?? false,
      enableMetaApi: settings.server?.enableMetaApi ?? false,
      https: settings.server?.https ?? false,
      key: settings.server?.key,
      cert: settings.server?.cert,
    }

    this.watch = settings.watch ?? false
  }
}
