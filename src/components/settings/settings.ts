import { deepmerge } from 'deepmerge-ts'

import { LogLevel, stringToLevel } from '../logger/log-level.js'
import { SettingsFile } from './provider.js'

export interface ServerSettings {
  level: LogLevel

  showDetails: boolean
  allowDynamicReload: boolean
}

const verbosityLevels = ['info', 'debug', 'trace']

export class Settings {
  public port: number
  public env: Record<string, string>

  public contractsGlobs: string | string[]
  public openApiGlobs: string | string[]
  public cwd: string

  public level: LogLevel

  public server: ServerSettings

  constructor(...inputs: SettingsFile[]) {
    const settings = deepmerge<SettingsFile[]>({}, ...inputs) as SettingsFile

    this.port = settings.port ?? 8090
    this.env = deepmerge({}, process.env, settings.env ?? {})

    this.contractsGlobs = settings.contracts ?? './contracts/**/*.ts'
    this.openApiGlobs = settings.openapi ?? './openapi/**/*.yaml'

    this.cwd = process.cwd()

    this.level = stringToLevel(verbosityLevels[settings.level] ?? 'info')

    this.server = {
      level: stringToLevel(settings.server?.level ?? 'info'),
      showDetails: settings.server?.showDetails ?? false,
      allowDynamicReload: settings.server?.allowDynamicReload ?? false,
    }
  }
}
