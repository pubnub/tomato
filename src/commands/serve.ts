import { container } from 'tsyringe'

import { Argv } from '../index.js'
import { CertStore } from '../components/cert-store.js'
import { FileSystem } from '../components/file-system.js'
import { Logger } from '../components/logger/index.js'
import { Prism } from '../components/prism.js'
import { Runtime } from '../components/runtime/runtime.js'
import { ScriptCache } from '../components/runtime/script-cache.js'
import { Server } from '../components/server/index.js'
import { Settings } from '../components/settings/index.js'
import { SettingsProvider } from '../components/settings/provider.js'
import { TypeScriptCompiler } from '../components/compiler/typescript.js'

const VERSION = '1.10.0'

export async function serve(argv: Argv) {
  try {
    const settings = await container.resolve(SettingsProvider).load(argv)

    container.registerInstance(Settings, settings)

    const logger = new Logger({ level: settings.level })

    logger.info('Hello Tomato v%s', VERSION)

    container.registerInstance('CertStoreLogger', logger.child({ module: 'certs' }))
    const certStore = container.resolve(CertStore)

    if (settings.server.https) {
      await certStore.loadCertificates()
    }

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

    container.registerInstance('ServerLogger', logger.child({ module: 'server' }, { level: settings.server.level }))
    const server = container.resolve(Server)

    await server.start()
  } catch (e) {
    console.error(`A fatal error has occured and Tomato has to exit:\n\t${e}`)
    process.exit(1)
  }
}
