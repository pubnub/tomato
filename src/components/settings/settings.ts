import { deepmerge } from 'deepmerge-ts'

import { LogLevel, stringToLevel } from '../logger/log-level.js'
import { SettingsFile } from './provider.js'

export interface LoggingSettings {
  level: LogLevel

  http: {
    level: LogLevel
    showDetails: boolean
  }
}

const verbosityLevels = ['info', 'debug', 'trace']

export class Settings {
  public port: number
  public env: Record<string, string>

  public contractsGlobs: string | string[]
  public openApiGlobs: string | string[]
  public cwd: string

  public logging: LoggingSettings

  constructor(...inputs: SettingsFile[]) {
    const settings = deepmerge<SettingsFile[]>({}, ...inputs) as SettingsFile

    this.port = settings.port ?? 8090
    this.env = deepmerge({}, process.env, settings.env ?? {})

    this.contractsGlobs = settings.contracts ?? './contracts/**/*.ts'
    this.openApiGlobs = settings.openapi ?? './openapi/**/*.yaml'

    this.cwd = process.cwd()

    const verbosityLevel = verbosityLevels[settings.level] ?? 'info'

    this.logging = {
      level: stringToLevel(settings.level > 0 ? verbosityLevel : settings.logging?.level ?? 'info'),
      http: {
        level: stringToLevel(settings.logging?.http?.level ?? 'info'),
        showDetails: settings.logging?.http?.details ?? false,
      },
    }
  }
}
