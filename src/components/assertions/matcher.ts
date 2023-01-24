import { AssertionError } from './assertion-error.js'

export type Lens<I, O> = (value: I) => O
export type Predicate<T> = (value: T) => boolean
export type Assertion<T, A extends any[]> = (...args: A) => Predicate<T>

export function combine<A, B, C>(first: Lens<A, B>, second: Lens<B, C>): Lens<A, C> {
  return (value: A) => second(first(value))
}

export class Matcher<O, T> {
  private _constructor: typeof Matcher<O, T>

  constructor(
    protected description: string,
    protected lens: Lens<O, T>,
    protected reverseLens: Lens<boolean, boolean> = (result) => result
  ) {
    this._constructor = new.target
  }

  protected copy(description: string, lens: Lens<O, T>, reverseLens: Lens<boolean, boolean>): this {
    return new this._constructor(description, lens, reverseLens) as this
  }

  protected zoom<V>(lens: Lens<T, V>): Lens<O, V> {
    return combine(this.lens, lens)
  }

  protected assert(predicate: Predicate<T>, message: string) {
    return (value: O) => {
      try {
        let actual = this.lens(value)

        const result = !this.reverseLens(predicate(actual))

        if (result) {
          const reason = `expected ${this.description} to ${message}, instead got ${JSON.stringify(actual)}`

          throw new AssertionError(reason)
        }
      } catch (e) {
        if (e instanceof AssertionError) {
          throw e
        } else {
          throw new Error(`Failure occured during verifying assertions: ${e}`)
        }
      }
    }
  }

  protected makeAssertion<A extends any[]>(
    predicate: (actual: T, ...args: A) => boolean,
    message: (...args: A) => string,
    cannotBeNullOrUndefined: boolean = false
  ) {
    return (...args: A) =>
      this.assert((actual) => {
        if (cannotBeNullOrUndefined) {
          if (actual === null || actual === undefined) {
            throw new AssertionError(`Expected ${this.description} to not be null or undefined`)
          }
        }

        return predicate(actual, ...args)
      }, message(...args))
  }

  satisfies = this.makeAssertion(
    (actual, _reason: string, predicate: (value: T) => boolean) => {
      try {
        return predicate(actual)
      } catch (e) {
        return false
      }
    },
    (reason, _predicate) => `satisfy this predicate: ${reason}`
  )

  satisfy = this.makeAssertion(
    (actual, _reason: string, predicate: (value: T) => boolean) => {
      try {
        return predicate(actual)
      } catch (e) {
        return false
      }
    },
    (reason, _predicate) => `satisfy this predicate: ${reason}`
  )

  equals = this.makeAssertion(
    (actual, expected: T) => actual === expected,
    (expected) => `equal ${expected}`
  )

  equal = this.makeAssertion(
    (actual, expected: T) => actual === expected,
    (expected) => `equal ${expected}`
  )

  get exists() {
    return this.assert((actual) => actual !== null && actual !== undefined, `exist`)
  }

  get exist() {
    return this.assert((actual) => actual !== null && actual !== undefined, `exist`)
  }

  get not(): this {
    return this.copy(
      `${this.description} not`,
      this.lens,
      combine(this.reverseLens, (value) => !value)
    )
  }

  get doesnt(): this {
    return this.not
  }
}
