import { container } from 'tsyringe'
import { TypeScriptCompiler } from '../components/compiler/typescript.js'
import { FileSystem } from '../components/file-system.js'

import { Logger, LogLevel } from '../components/logger/index.js'
import { Prism } from '../components/prism.js'
import { Runtime } from '../components/runtime/runtime.js'
import { ScriptCache } from '../components/runtime/script-cache.js'
import { Server } from '../components/server/index.js'
import { Settings } from '../components/settings/index.js'
import { SettingsProvider } from '../components/settings/provider.js'
import { Argv } from '../index.js'

const VERSION = '1.0.1'

export async function serve(argv: Argv) {
  try {
    const settings = await container.resolve(SettingsProvider).load(argv)

    container.registerInstance(Settings, settings)

    const logger = new Logger({ level: LogLevel.info })

    logger.info('Hello Tomato v%s', VERSION)

    container.resolve(FileSystem)
    container.register('Compiler', TypeScriptCompiler)

    container.registerInstance('PrismLogger', logger.child({ module: 'prism' }))
    const prism = container.resolve(Prism)

    await prism.loadSpecs()

    container.registerInstance('CacheLogger', logger.child({ module: 'cache' }))
    const scriptCache = container.resolve(ScriptCache)

    container.registerInstance('RuntimeLogger', logger.child({ module: 'runtime' }))
    const runtime = container.resolve(Runtime)

    await scriptCache.loadScripts(runtime)

    container.registerInstance('ServerLogger', logger.child({ module: 'server' }))
    const server = container.resolve(Server)

    await server.start()
  } catch (e) {
    console.error(`A fatal error has occured and Tomato has to exit.\n${e}`)
    process.exit(1)
  }
}
