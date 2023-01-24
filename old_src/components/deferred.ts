export class Deferred<T> {
  #promise: Promise<T>
  #resolve!: (value: T) => void
  #reject!: (reason: any) => void

  isDisposed: boolean = false

  constructor() {
    this.#promise = new Promise((resolve, reject) => {
      this.#resolve = resolve
      this.#reject = reject
    })
  }

  get promise() {
    if (this.isDisposed) {
      throw new Error('Deferred has been disposed')
    }

    return this.#promise
  }

  resolve(value: T) {
    this.#resolve(value)
  }

  reject(reason?: any) {
    this.#reject(reason)
  }

  dispose() {
    if (!this.isDisposed) {
      this.isDisposed = true

      //@ts-ignore-line
      this.#promise = undefined
      //@ts-ignore-line
      this.#resolve = undefined
      //@ts-ignore-line
      this.#reject = undefined
    }
  }
}
