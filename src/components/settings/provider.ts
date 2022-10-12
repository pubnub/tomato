import { singleton } from 'tsyringe'

import { parse } from 'toml'

import { FileSystem } from '../file-system.js'
import { Settings } from './settings.js'
import { LogLevelString } from '../logger/log-level.js'

export interface SettingsFile {
  port?: number
  level?: number
  contracts?: Array<string> | string
  openapi?: Array<string> | string

  env?: Record<string, string>
  cwd?: string

  server?: {
    level?: LogLevelString

    showDetails?: boolean
    enableMetaApi?: boolean
  }

  watch?: boolean
}

@singleton()
export class SettingsProvider {
  constructor(private fs: FileSystem) {}

  async load(argv: SettingsFile): Promise<Settings> {
    try {
      const settingsFile = await this.fs.read('./toma.toml')
      const settingsObject: SettingsFile = parse(settingsFile.contents)
      return new Settings(settingsObject, argv)
    } catch (e) {
      return new Settings(argv)
    }
  }
}
