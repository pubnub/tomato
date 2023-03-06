import { inject, singleton } from 'tsyringe'

import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import FastifyMultipart from '@fastify/multipart'

import type { Http2SecureServer } from 'http2'
import * as zlib from 'zlib'

import { MockResponse } from '../../interfaces.js'
import { Deferred } from '../deferred.js'

import { Logger } from '../logger/index.js'
import { isPrismError, Prism } from '../prism.js'
import { Instance } from '../runtime/instance.js'
import { Runtime } from '../runtime/runtime.js'
import { ScriptCache } from '../runtime/script-cache.js'
import { Settings } from '../settings/index.js'
import { CertStore } from '../cert-store.js'

function handleCors(res: any) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
}

export interface ServerState {
  expectations: {
    pending: string[]
    failed: string[]
    succeeded: string[]
  }

  validations: string[]

  script?: string
}

@singleton()
export class Server {
  currentInstance?: Instance
  state: ServerState = {
    expectations: {
      pending: [],
      failed: [],
      succeeded: [],
    },

    validations: [],

    script: undefined,
  }

  private clearServerState() {
    this.state = {
      expectations: {
        pending: [],
        failed: [],
        succeeded: [],
      },

      validations: [],

      script: undefined,
    }
  }

  server: FastifyInstance

  constructor(
    @inject('ServerLogger') private logger: Logger,
    private settings: Settings,
    private runtime: Runtime,
    private scriptCache: ScriptCache,
    private prism: Prism,
    private certStore: CertStore
  ) {
    if (settings.server.https) {
      this.server = Fastify({
        logger: logger.child({ module: 'http' }, { level: settings.server.level }),
        http2: true,
        https: {
          allowHTTP1: true, // fallback support for HTTP1
          key: this.certStore.key?.contents,
          cert: this.certStore.cert?.contents,
        },
      }) as unknown as FastifyInstance
    } else {
      this.server = Fastify({
        logger: logger.child({ module: 'http' }, { level: settings.server.level }),
      })
    }

    this.server.register(FastifyMultipart, { attachFieldsToBody: 'keyValues' })

    this.server.addContentTypeParser('application/json', { parseAs: 'buffer' }, function(request, rawBody, done) {
      let processingError: Error | null = null
      let processedBody = rawBody

      if (request.headers['content-encoding'] && request.headers['content-encoding'] === 'gzip') {
        processedBody = zlib.gunzipSync(rawBody)
      }

      try {
        processedBody = JSON.parse(processedBody.toString('utf-8'))
      } catch (e) {
        processingError = e as Error
      }

      done(processingError, processedBody)
    })

    this.server.setErrorHandler((error, request, reply) => {
      this.logger.error(error)

      this.currentInstance?.stop()
      this.currentInstance = undefined

      reply.status(500).send({ status: 500, error: error.message })
    })

    this.server.route<{
      Querystring: {
        __contract__script__: string
        [key: string]: string
      }
    }>({
      method: 'GET',
      url: '/init',
      handler: async (request, reply) => {
        handleCors(reply)

        if (this.currentInstance) {
          this.currentInstance?.stop()
          this.currentInstance = undefined
        }

        const { __contract__script__, ...queryParams } = request.query

        if (!__contract__script__) {
          throw new Error('Missing __contract__script__ query param')
        }

        const script = this.scriptCache.getScript(__contract__script__)

        if (!script) {
          throw new Error(`Cannot find a script named "${__contract__script__}"`)
        }

        this.clearServerState()
        this.state.script = script.name

        const [context, controller] = this.runtime.createContext(script.source, this.state, script)

        this.currentInstance = new Instance(
          script,
          context,
          controller,
          this.logger.child({ module: 'script', script: script.name }, { level: undefined })
        )

        this.currentInstance.start(queryParams)

        return { ok: true }
      },
    })

    this.server.route({
      method: 'GET',
      url: '/expect',
      handler: async (request, reply) => {
        handleCors(reply)
        return this.state
      },
    })

    if (this.settings.server.enableMetaApi) {
      this.logger.info('Meta API is enabled!')

      this.server.route<{
        Querystring: {
          contract: string
        }
      }>({
        method: ['GET'],
        url: '/meta/reload',
        handler: async (request, reply) => {
          handleCors(reply)

          await this.scriptCache.reloadScript(request.query.contract, this.runtime)

          return { ok: true }
        },
      })
    }

    this.server.route({
      method: ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT', 'OPTIONS', 'SEARCH', 'TRACE'],
      url: '*',
      handler: async (request, reply) => {
        handleCors(reply)

        if (!this.currentInstance) {
          throw new Error('No script instance running')
        }

        const path = new URL(request.url, 'resolve://')

        const mockRequest = {
          method: request.method as 'delete' | 'get' | 'head' | 'patch' | 'post' | 'put' | 'options' | 'trace',
          url: {
            path: path.pathname,
            query: request.query as Record<string, any>,
          },
          headers: request.headers as Record<string, string>,
          body: request.body,
        }

        if (this.settings.openApiGlobs) {
          try {
            const result = await this.prism.validate(mockRequest)

            for (const validation of result.input) {
              this.state.validations.push(`\`req.${validation?.path?.join('.')}\` ${validation.message}`)
            }
          } catch (e) {
            if (isPrismError(e)) {
              this.state.validations.push(e.detail)
              this.logger.warn(`OpenAPI validation failed: ${e.detail}`)
            }
          }
        }

        const responseDeferred = new Deferred<MockResponse>()

        this.currentInstance.controller.push({ value: mockRequest, respond: responseDeferred })

        const response = await responseDeferred.promise

        if (response.status) {
          reply.status(response.status)
        }

        if (response.headers) {
          reply.headers(response.headers)
        }

        responseDeferred.dispose()

        if (response.body) {
          return JSON.stringify(response.body)
        }

        return
      },
    })
  }

  async start() {
    await this.server.listen({ port: this.settings.port })
  }
}
