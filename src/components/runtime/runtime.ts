import { inject, injectable } from 'tsyringe'

import { createRequire } from 'node:module'
import { format } from 'node:util'
import { createContext } from 'node:vm'

import { ExpectInterface, ExpectParams, MockRequest, MockResponse } from '../../interfaces.js'
import { ContinuationController } from './continuation.js'
import { Logger } from '../logger/index.js'
import { Settings } from '../settings.js'
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
  require: (identifier: string) => any
  json: (path: string) => any
}

@injectable()
export class Runtime {
  constructor(
    @inject('RuntimeLogger') private logger: Logger,
    private settings: Settings,
    private moduleCache: ModuleCache,
    private fs: FileSystem
  ) {}

  createContext(
    source: File,
    serverState?: ServerState,
    script?: Script
  ): [Context, ContinuationController<Continuation>] {
    const logger = this.logger.child({ script: script?.name ?? source.filename })
    const controller = new ContinuationController<Continuation>()

    const expect = async ({ description, validations }: ExpectParams) => {
      const { value, respond } = await controller.pull()

      let anyExpectationsFailed = false
      for (const predicate of validations) {
        try {
          predicate(value)
        } catch (e) {
          anyExpectationsFailed = true
          logger.error(`Expectation for "${description}" failed: ${e.message}`)
          serverState?.expectations?.failed?.push(`${description}: ${e.message}`)
        }
      }

      if (anyExpectationsFailed) {
        respond.reject(new Error('One or more expectations failed.'))
        throw expectedFailure
      }

      serverState?.expectations?.succeeded?.push(description)

      return {
        async respond(response: MockResponse) {
          return respond.resolve(response)
        },
      }
    }

    const legacyExpect = (description: string) => ({
      verify: async (f: (req: any) => boolean | void) => {
        const req = await expect({
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
          async respond(status: number, headers: Record<string, string>, body: any) {
            return req.respond({
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

      return module.exports
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
      require: require,
      json: json,
    }

    return [createContext(context) as Context, controller]
  }
}
