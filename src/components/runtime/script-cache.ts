import { inject, singleton } from 'tsyringe'

import { Compiler } from '../compiler/compiler.js'
import { File, FileSystem } from '../file-system.js'
import { Logger } from '../logger/index.js'
import { Settings } from '../settings/settings.js'
import { Runtime } from './runtime.js'
import { Script } from './script.js'

@singleton()
export class ScriptCache {
  private scripts: Map<string, Script> = new Map()

  constructor(
    @inject('Compiler') private compiler: Compiler,
    @inject('CacheLogger') private logger: Logger,
    private fs: FileSystem,
    private settings: Settings
  ) {}

  getScript(name: string) {
    return this.scripts.get(name)
  }

  loadScript(source: File, runtime: Runtime) {
    const [context] = runtime.createContext(source)
    const compiled = this.compiler.compile(source)
    const script = new Script(compiled, context)

    this.scripts.set(script.name, script)

    return script
  }

  async reloadScript(path: string, runtime: Runtime) {
    this.logger.info('Reloading script "%s"', path)

    const source = await this.fs.read(path)

    this.loadScript(source, runtime)
  }

  async loadScripts(runtime: Runtime) {
    this.logger.info(
      'Looking for contracts using a pattern "%s"',
      Array.isArray(this.settings.contractsGlobs)
        ? this.settings.contractsGlobs.join(', ')
        : this.settings.contractsGlobs
    )

    const sources = await this.fs.readFiles(this.settings.contractsGlobs)

    if (sources.length === 0) {
      this.logger.warn("Didn't find any scripts.")
    }

    for (const source of sources) {
      this.logger.debug('Found script "%s"', source.path)

      try {
        const script = this.loadScript(source, runtime)

        this.scripts.set(script.name, script)

        this.logger.debug('Loaded script "%s"', script.name)
      } catch (e) {
        this.logger.warn(e, 'Failed to parse script "%s". Skipping...', source.path)
      }
    }

    if (this.settings.watch) {
      this.logger.info('Watching for changes...')
      const watcher = await this.fs.watchFiles(this.settings.contractsGlobs)

      const reload = async (path: string) => {
        await this.reloadScript(path, runtime)
      }

      watcher.on('change', reload)
      watcher.on('add', reload)
      watcher.on('unlink', (path) => {
        this.scripts.forEach((script) => {
          if (script.source.path === path) {
            this.scripts.delete(script.name)
          }
        })
      })
    }
  }
}
