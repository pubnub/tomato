import { inject, singleton } from 'tsyringe'

import Fastify, { FastifyInstance } from 'fastify'
import type { Http2SecureServer } from 'http2'

import { Logger } from '../../components/logger/index.js'
import { Instance } from '../../components/runtime/instance.js'
import { Runtime } from '../../components/runtime/runtime.js'
import { ScriptCache } from '../../components/runtime/script-cache.js'
import { Settings } from '../../components/settings/index.js'
import { CertStore } from '../../components/cert-store.js'

function handleCors(res: any) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
}

@singleton()
export class LoadServer {
  currentInstance?: Instance

  server: FastifyInstance | FastifyInstance<Http2SecureServer>

  constructor(
    @inject('ServerLogger') private logger: Logger,
    private settings: Settings,
    private runtime: Runtime,
    private scriptCache: ScriptCache,
    private certStore: CertStore
  ) {
    if (settings.server.https) {
      this.server = Fastify({
        logger: logger.child({ module: 'http' }, { level: settings.server.level }),
        http2: true,
        https: {
          allowHTTP1: true,
          key: this.certStore.key?.contents,
          cert: this.certStore.cert?.contents,
        },
      })
    } else {
      this.server = Fastify({
        logger: logger.child({ module: 'http' }, { level: settings.server.level }),
      })
    }

    this.server.setErrorHandler((error, request, reply) => {
      this.logger.error(error)

      this.currentInstance?.stop()
      this.currentInstance = undefined

      reply.status(500).send({ status: 500, error: error.message })
    })
  }

  async start() {
    await this.server.listen({ port: this.settings.port })
  }
}
