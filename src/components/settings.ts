import { singleton } from 'tsyringe'

import { parse } from 'toml'

import { FileSystem } from './file-system.js'
import { LogLevel, stringToLevel } from './logger/log-level.js'

export interface SettingsOptions {
  port: number
  env: Record<string, string>
  cwd: string

  contracts: string | string[]
  openapi: string | string[]

  logging?: {
    level?: LogLevel

    http?: {
      level?: LogLevel
      showDetails?: boolean
      hideExpects?: boolean
    }

    server?: {
      level?: LogLevel
    }

    script?: {
      level?: LogLevel
    }
  }
}

@singleton()
export class Settings {
  public port: number = 8090
  public env: Record<string, string> = {}
  public cwd: string = process.cwd()

  public contractsGlobs: string | string[] = './contracts/**/*.ts'
  public openApiGlobs: string | string[] = './openapi/**/*.yaml'

  public logging = {
    level: LogLevel.info,
    http: {
      level: LogLevel.info,
      showDetails: false,
      hideExpect: true,
    },
    server: {},
    script: {},
    prism: {},
    cache: {},
  }

  constructor(private fs: FileSystem) {}

  async loadFromFile() {
    try {
      const settingsFile = await this.fs.read('./toma.toml')
      const settingsObject = parse(settingsFile.contents)

      Object.assign(this, {
        openApiGlobs: settingsObject.openapi,
        contractsGlobs: settingsObject.contracts,
        env: settingsObject.env,
        port: settingsObject.port,
      })
    } catch (error) {}
  }
}
