import { AssertionError } from './assertion-error'

export type Lens<I, O> = (value: I) => O
export type Predicate<T> = (value: T) => boolean
export type Assertion<T, A extends any[]> = (...args: A) => Predicate<T>

export function combine<A, B, C>(first: Lens<A, B>, second: Lens<B, C>): Lens<A, C> {
  return (value: A) => second(first(value))
}

export class Matcher<O, T> {
  constructor(
    protected description: string,
    protected lens: Lens<O, T>,
    protected resultLens: Lens<boolean, boolean> = (value) => value
  ) {}

  protected zoom<V>(lens: Lens<T, V>): Lens<O, V> {
    return combine(this.lens, lens)
  }

  protected assert(predicate: Predicate<T>, message: string) {
    return (value: O) => {
      let actual: T

      try {
        actual = this.lens(value)
      } catch (e) {
        if (e instanceof AssertionError) {
          throw new AssertionError(`expected ${this.description} to ${e.message}`)
        }
      }

      const result = this.resultLens(!predicate(actual))

      if (result) {
        const reason = `expected ${this.description} to ${message}, instead got ${JSON.stringify(actual)}`

        throw new AssertionError(reason)
      }
    }
  }

  protected makeAssertion<A extends any[]>(
    predicate: (actual: T, ...args: A) => boolean,
    message: (...args: A) => string
  ) {
    return (...args: A) => this.assert((actual) => predicate(actual, ...args), message(...args))
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

  equals = this.makeAssertion(
    (actual, expected: T) => actual === expected,
    (expected) => `equal ${expected}`
  )

  get exists() {
    return this.assert((actual) => actual !== null && actual !== undefined, `exist`)
  }
}
