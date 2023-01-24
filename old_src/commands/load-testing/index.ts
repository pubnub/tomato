import { container } from 'tsyringe'

import { Argv } from '../../index.js'
import { Logger } from '../../components/logger/index.js'
import { Settings } from '../../components/settings/settings.js'
import { SettingsProvider } from '../../components/settings/provider.js'
import { CertStore } from '../../components/cert-store.js'
import { TypeScriptCompiler } from '../../components/compiler/typescript.js'
import { FileSystem } from '../../components/file-system.js'
import { ScriptCache } from '../../components/runtime/script-cache.js'
import { Runtime } from '../../components/runtime/runtime.js'

export async function loadTesting(argv: Argv, version: string, additionalOptions: Record<string, any>) {
  try {
    const settings = await container.resolve(SettingsProvider).load(argv)

    container.registerInstance(Settings, settings)

    const logger = new Logger({ level: settings.level })

    logger.info('Hello Tomato v%s', version)

    container.registerInstance('CertStoreLogger', logger.child({ module: 'certs' }))
    const certStore = container.resolve(CertStore)

    if (settings.server.https) {
      await certStore.loadCertificates()
    }

    const fs = container.resolve(FileSystem)
    container.register('Compiler', TypeScriptCompiler)

    container.registerInstance('CacheLogger', logger.child({ module: 'cache' }))
    const scriptCache = container.resolve(ScriptCache)

    container.registerInstance('RuntimeLogger', logger.child({ module: 'runtime' }))
    const runtime = container.resolve(Runtime)

    const loadTestContract = await fs.read(argv.contract)

    const script = scriptCache.loadScript(loadTestContract, runtime)

    container.registerInstance('ServerLogger', logger.child({ module: 'server' }, { level: settings.server.level }))

    // await server.start()
  } catch (e) {
    console.error(`A fatal error has occured and Tomato has to exit:\n\t${e}`)
    process.exit(1)
  }
}
