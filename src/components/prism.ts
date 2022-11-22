import { inject, injectable } from 'tsyringe'
import { parse } from 'yaml'

import { getHttpOperationsFromSpec } from '@stoplight/prism-cli/dist/operations.js'
import { createInstance, IHttpConfig, IHttpRequest, IHttpResponse } from '@stoplight/prism-http'
import { IPrism } from '@stoplight/prism-core'
import { IHttpOperation } from '@stoplight/types'

import { File, FileSystem } from './file-system.js'
import { Logger } from './logger/index.js'
import { MockRequest } from '../interfaces.js'
import { Settings } from './settings/index.js'

export function isPrismError(e: unknown): e is Error & { detail: string } {
  return typeof e === 'object' && e !== null && 'detail' in e
}

export class Spec {
  constructor(public source: File, public operations: IHttpOperation<false>[]) {}
}

@injectable()
export class Prism {
  private client: IPrism<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>
  private specs = new Map<string, Spec>()

  constructor(@inject('PrismLogger') private logger: Logger, private fs: FileSystem, private settings: Settings) {
    this.client = createInstance(
      {
        mock: { dynamic: false },
        validateRequest: true,
        validateResponse: true,
        checkSecurity: true,
        errors: true,
        upstreamProxy: 'https://ps.pndsn.com',
      },
      {
        logger: logger as any,
      }
    )
  }

  private get operations() {
    return Array.from(this.specs.values()).flatMap((spec) => spec.operations)
  }

  async validate(request: MockRequest) {
    const result = await this.client.request(request, this.operations)()

    if (result._tag === 'Left') {
      throw result.left
    } else {
      return result.right.validations
    }
  }

  async loadSpec(source: File) {
    const document = parse(source.contents, (key, value) => {
      if (key === '$ref' && typeof value === 'string' && value.startsWith('.')) {
        return this.fs.resolveFromCwd(source.parentDirectory, value)
      }

      return value
    })

    const operations = await getHttpOperationsFromSpec(document)
    const spec = new Spec(source, operations)

    this.specs.set(source.path, spec)

    return spec
  }

  async reloadSpec(path: string) {
    this.logger.info('Reloading spec "%s"', path)

    const source = await this.fs.read(path)

    this.loadSpec(source)
  }

  async loadSpecs() {
    if (!this.settings.openApiGlobs) {
      this.logger.info('Skipping OpenAPI validation...')
      return
    }

    this.logger.info(
      'Looking for OpenAPI specs using a pattern "%s"',
      Array.isArray(this.settings.openApiGlobs) ? this.settings.openApiGlobs.join(', ') : this.settings.openApiGlobs
    )

    const sources = await this.fs.readFiles(this.settings.openApiGlobs)

    if (sources.length === 0) {
      this.logger.warn("Didn't find any specs.")
    }

    for (const source of sources) {
      this.logger.debug('Found spec "%s"', source.path)

      try {
        await this.loadSpec(source)

        this.logger.debug('Loaded spec "%s"', source.path)
      } catch (e) {
        this.logger.warn('Failed to parse spec "%s". Skipping...', source.path)
      }
    }

    if (this.settings.watch) {
      this.logger.info('Watching for changes...')
      const watcher = await this.fs.watchFiles(this.settings.openApiGlobs)

      const reload = async (path: string) => {
        await this.reloadSpec(path)
      }

      watcher.on('change', reload)
      watcher.on('add', reload)
      watcher.on('unlink', (path) => {
        this.specs.delete(path)
      })
    }
  }
}
