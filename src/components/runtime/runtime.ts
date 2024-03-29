import { inject, injectable } from 'tsyringe'

import { createRequire } from 'node:module'
import { format } from 'node:util'
import { createContext } from 'node:vm'

import {
  ExpectAllInterface,
  ExpectAllParams,
  ExpectInterface,
  ExpectParams,
  MockRequest,
  MockResponse,
} from '../../interfaces.js'
import { ContinuationController } from './continuation.js'
import { Logger } from '../logger/index.js'
import { Settings } from '../settings/index.js'
import { File, FileSystem } from '../file-system.js'
import { assert } from './context/validation.js'
import { timetoken } from './context/timetoken.js'
import { ModuleCache } from './module-cache.js'
import { ServerState } from '../server/index.js'
import { Deferred } from '../deferred.js'
import { Script } from './script.js'

export const expectedFailure = Symbol('Expected Failure')

export type Continuation = { value: MockRequest; respond: Deferred<MockResponse> }

export interface Context {
  exports: {
    name?: string
    default?: () => Promise<void>
    [key: string]: any
  }

  process: {
    env: Record<string, string | undefined>
  }

  console: {
    log: (...args: any[]) => void
    info: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
    trace: (...args: any[]) => void
  }

  timetoken: {
    now: () => string
  }

  assert: typeof assert

  expect: ExpectInterface
  expectAll: ExpectAllInterface
  require: (identifier: string) => any
  json: (path: string) => any
  sleep: (milliseconds: number) => Promise<void>
}

@injectable()
export class Runtime {
  constructor(
    @inject('RuntimeLogger') private logger: Logger,
    private settings: Settings,
    private moduleCache: ModuleCache,
    private fs: FileSystem,
  ) {}

  createContext(
    source: File,
    serverState?: ServerState,
    script?: Script,
  ): [Context, ContinuationController<Continuation>] {
    const logger = this.logger.child({ script: script?.name ?? source.filename })
    const controller = new ContinuationController<Continuation>()

    const pullContinuations = async (continuationsCount?: number, timeout?: number) => {
      let continuationPromises: Promise<Continuation>[] = []
      let continuations: Continuation[] = []
      continuationsCount = continuationsCount ?? 1
      timeout = timeout ?? 30000

      while (continuationPromises.length < continuationsCount) {
        continuationPromises.push(
          controller.pull().then((value) => {
            continuations.push(value)
            return value
          }),
        )
      }

      let timeoutToken: string | number | NodeJS.Timeout | undefined
      const timeoutPromise: Promise<Continuation[]> = new Promise((resolve) => {
        timeoutToken = setTimeout(() => resolve([]), timeout)
      })

      return Promise.race([
        timeoutPromise,
        Promise.all(continuationPromises).then(() => clearTimeout(timeoutToken)),
      ]).then(() => {
        if (continuations.length !== continuationsCount) {
          logger.error(
            `Unable to pull the required number of requests (${continuations.length} from ${continuationsCount} has been received).`,
          )
          serverState?.expectations?.failed?.push(`Expected to receive ${continuationsCount} requests.`)

          for (const { respond } of continuations) {
            respond.reject(new Error('One or more expectations failed.'))
          }

          throw expectedFailure
        }
        return continuations
      })
    }

    const validateContinuation = (continuation: Continuation, params: ExpectParams | ExpectAllParams) => {
      const { value, respond } = continuation
      const { description, validations } = params

      let anyExpectationsFailed = false
      for (const predicate of validations) {
        try {
          predicate(value)
        } catch (e) {
          anyExpectationsFailed = true

          if (e instanceof Error) {
            logger.error(`Expectation for "${description}" failed: ${e.message}`)
            serverState?.expectations?.failed?.push(`${description}: ${e.message}`)
          } else {
            logger.error(`Expectation for "${description}" failed: ${e}`)
            serverState?.expectations?.failed?.push(`${description}: ${e}`)
          }
        }
      }

      if (anyExpectationsFailed) {
        respond.reject(new Error('One or more expectations failed.'))
        throw expectedFailure
      }

      serverState?.expectations?.succeeded?.push(description)
    }

    const expectAll = async (parameters: ExpectAllParams[], timeout?: number) => {
      let expectedContinuations = await pullContinuations(parameters.length, timeout)

      expectedContinuations.sort(({ value: valueA }, { value: valueB }) => {
        for (const { match: matcher } of parameters) {
          const matchA = matcher(valueA)
          const matchB = matcher(valueB)

          if (matchA && !matchB) return -1
          else if (!matchA && matchB) return 1
        }
        return 0
      })

      try {
        for (let idx = 0; idx < parameters.length; idx++) {
          validateContinuation(expectedContinuations[idx], parameters[idx])
        }
      } catch (e) {
        for (const { respond } of expectedContinuations) {
          respond.reject(new Error('One or more expectations failed.'))
        }

        throw e
      }

      return expectedContinuations.map(({ value, respond }) => ({
        ...value,
        async respond(response: MockResponse) {
          return respond.resolve(response)
        },
        async abort() {
          return respond.reject(new Error('request aborted'))
        },
      }))
    }

    const expect = async (parameters: ExpectParams, timeout?: number) => {
      const continuation = (await pullContinuations(1, timeout)).pop()
      if (!continuation) throw expectedFailure
      const { value, respond } = continuation

      validateContinuation(continuation, parameters)

      return {
        ...value,
        async respond(response: MockResponse) {
          return respond.resolve(response)
        },
        async abort() {
          return respond.reject(new Error('request aborted'))
        },
      }
    }

    const legacyExpect = (description: string) => ({
      verify: async (f: (req: any) => boolean | void) => {
        const { respond, ...rest } = await expect({
          description,
          validations: [
            (req) =>
              f({
                path: req.url.path,
                query: req.url.query,
                headers: req.headers,
                body: req.body,
                method: req.method,
              }),
          ],
        })

        return {
          ...rest,
          async respond(status: number, headers: Record<string, string>, body: any) {
            return respond({
              status,
              headers: headers,
              body: body,
            })
          },
        }
      },
    })

    const nativeRequire = createRequire(this.fs.resolveFromCwd(source.path))

    const require = (identifier: string) => {
      if (!identifier.startsWith('.')) {
        return nativeRequire(identifier)
      }

      if (identifier === '../index' || identifier === '../../index') {
        return {
          expect: legacyExpect,
          parseBodyJson: (body: any) => {
            return body
          },
          parseMessageFromRequest: (req: any) => {
            return JSON.parse(decodeURIComponent(req.path.substring(req.path.lastIndexOf('/0/') + 3)))
          },
          respond: () => Promise.reject('unimplemented'),
        }
      }

      const dependencyPath = this.fs.resolveFromCwd(source.parentDirectory, identifier)

      const dependencySource = this.fs.findFile(`${dependencyPath}.ts`, `${dependencyPath}/index.ts`)

      if (!dependencySource) {
        throw new Error('Script tried to import "${dependencyPath}", but the runtime cannot find it')
      }

      const module = this.moduleCache.loadModule(dependencySource, this)

      return module?.exports
    }

    const json = (path: string) => {
      const jsonPath = this.fs.resolveFromCwd(path)
      const file = this.fs.readSync(jsonPath)

      return JSON.parse(file.contents)
    }

    const context: Context = {
      exports: {},
      process: {
        env: this.settings.env,
      },
      console: {
        log: (...args: any[]) => logger.info(format(...args)),
        info: (...args: any[]) => logger.info(format(...args)),
        error: (...args: any[]) => logger.error(format(...args)),
        warn: (...args: any[]) => logger.warn(format(...args)),
        trace: (...args: any[]) => logger.trace(format(...args)),
      },
      timetoken: timetoken,
      assert: assert,
      expect: expect,
      expectAll: expectAll,
      require: require,
      json: json,
      sleep: (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
    }

    return [createContext(context) as Context, controller]
  }
}
