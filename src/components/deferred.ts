export class Deferred<T> {
  #promise: Promise<T>
  #resolve: (value: T) => void
  #reject: (reason: any) => void

  constructor() {
    this.#promise = new Promise((resolve, reject) => {
      this.#resolve = resolve
      this.#reject = reject
    })
  }

  get promise() {
    return this.#promise
  }

  resolve(value: T) {
    this.#resolve(value)
  }

  reject(reason?: any) {
    this.#reject(reason)
  }
}
