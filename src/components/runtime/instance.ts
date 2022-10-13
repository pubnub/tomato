import { Logger } from '../logger/index.js'
import { ContinuationController } from './continuation.js'
import { Context, Continuation, expectedFailure } from './runtime.js'
import { Script } from './script.js'

export class Instance {
  constructor(
    public script: Script,
    public context: Context,
    public controller: ContinuationController<Continuation>,
    private logger: Logger
  ) {}

  start() {
    const closure = this.script.getClosure(this.context)

    closure().then(this.handleResolve).catch(this.handleReject)
    this.logger.info('Script has started.')
  }

  private isStopped = false

  stop() {
    this.isStopped = true
    this.controller.dispose()
  }

  handleResolve = () => {
    if (this.isStopped) return

    this.logger.info('Script resolved successfully.')
    this.controller.dispose()
  }

  handleReject = (e) => {
    if (this.isStopped) return

    if (e !== expectedFailure) {
      this.logger.error(e, 'Script rejected.')
    }

    this.controller.dispose()
  }
}
