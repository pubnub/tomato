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

  async loadSpecs() {
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
        const document = parse(source.contents, (key, value) => {
          if (key === '$ref' && typeof value === 'string' && value.startsWith('.')) {
            return this.fs.resolveFromCwd(source.parentDirectory, value)
          }

          return value
        })

        const operations = await getHttpOperationsFromSpec(document)
        const spec = new Spec(source, operations)

        this.specs.set(source.path, spec)

        this.logger.debug('Loaded spec "%s"', source.path)
      } catch (e) {
        this.logger.warn('Failed to parse spec "%s". Skipping...', source.path)
      }
    }
  }
}
