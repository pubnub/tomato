import { Deferred } from '../deferred.js'

type PushRequest = { type: 'push' }
type PullRequest = { type: 'pull' }
type AnyRequest<I> = (PushRequest | PullRequest) & { next: Deferred<I> }

export class ContinuationController<I> {
  public isDisposed = false
  private continuations: Array<AnyRequest<I>> = []

  private trackedDeferreds: Array<Deferred<any>> = []

  private get peek(): AnyRequest<I> {
    return this.continuations[this.continuations.length - 1]
  }

  private pop(type: 'push' | 'pull') {
    if (this.continuations.length === 0) {
      return
    }

    if (type !== this.peek.type) {
      return
    }

    return this.continuations.pop()
  }

  push(value: I) {
    if (this.isDisposed) {
      throw new Error('Script has been disposed.')
    }

    let request = this.pop('pull')

    if (!request) {
      request = { type: 'push', next: new Deferred<I>() }

      this.continuations.push(request)
      this.track(request.next)
    }

    request.next.resolve(value)

    return
  }

  async pull() {
    if (this.isDisposed) {
      throw new Error('Script has been disposed.')
    }

    let request = this.pop('push')

    if (!request) {
      request = { type: 'pull', next: new Deferred<I>() }

      this.continuations.push(request)
      this.track(request.next)
    }

    return request.next.promise
  }

  track(deferred: Deferred<any>) {
    this.trackedDeferreds.push(deferred)
  }

  dispose() {
    if (!this.isDisposed) {
      this.isDisposed = true

      for (const deferred of this.trackedDeferreds) {
        deferred.reject(new Error('Script has been disposed.'))
        deferred.dispose()
      }

      for (const continuation of this.continuations) {
        continuation.next.dispose()
      }
    }
  }
}
