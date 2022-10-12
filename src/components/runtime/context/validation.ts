import { MockRequest, MockResponse } from '../../../interfaces'

export type MatcherConstructor<D, T> = { new (lens: Lens<D, T>): Matcher<D, T> }
export type Lens<I, O> = (value: I) => O
export type Predicate<D> = (req: D) => boolean
export type Assertion<D, A extends any[]> = (...args: A) => Predicate<D>

export class Matcher<D, T> {
  constructor(protected description: string, protected lens: Lens<D, T>) {}

  protected zoom<O>(f: Lens<T, O>): Lens<D, O> {
    return (value) => f(this.lens(value))
  }

  protected assert<A extends any[]>(
    predicate: (actual: T, ...args: A) => boolean,
    message: (...args: A) => string
  ): Assertion<D, A> {
    return (...args: A) =>
      (value: D) => {
        let actual: T

        try {
          actual = this.lens(value)
        } catch (e) {
          throw new Error(`expected ${this.description} to ${message(...args)}, instead it's undefined`)
        }

        if (!predicate(actual, ...args)) {
          const reason = `expected ${this.description} to ${message(...args)}, instead got ${JSON.stringify(actual)}`

          throw new Error(reason)
        }

        return predicate(actual, ...args)
      }
  }
}

export class NumberMatcher<D> extends Matcher<D, number> {
  between = this.assert(
    (actual, min: number, max: number) => actual >= min && actual <= max,
    (min, max) => `be between ${min} and ${max}`
  )
  gt = this.assert(
    (actual, value: number) => actual > value,
    (value) => `be greater than ${value}`
  )
  gte = this.assert(
    (actual, value: number) => actual >= value,
    (value) => `be greater than or equal to ${value}`
  )
  lt = this.assert(
    (actual, value: number) => actual < value,
    (value) => `be less than ${value}`
  )
  lte = this.assert(
    (actual, value: number) => actual <= value,
    (value) => `be less than or equal to ${value}`
  )
  equals = this.assert(
    (actual, value: number) => actual === value,
    (value) => `be equal to ${value}`
  )
  around = this.assert(
    (actual, value: number, epsilon: number = 0.01) => Math.abs(actual - value) < epsilon,
    (value) => `be approximately equal to ${value}`
  )
}

export class StringMatcher<D> extends Matcher<D, string> {
  equals = this.assert(
    (actual, expected: string) => actual === expected,
    (expected) => `be equal to "${expected}"`
  )
  startsWith = this.assert(
    (actual, prefix: string) => actual.startsWith(prefix),
    (prefix) => `start with "${prefix}"`
  )
  endsWith = this.assert(
    (actual, postfix: string) => actual.endsWith(postfix),
    (postfix) => `end with "${postfix}"`
  )
  isOneOf = this.assert(
    (actual, entries: string[]) => entries.includes(actual),
    (entries) => `be one of ${entries.map((entry) => `"${entry}"`).join(', ')}`
  )

  matches = this.assert(
    (actual, pattern: string | RegExp, flags?: string) =>
      (typeof pattern === 'string' ? new RegExp(pattern, flags) : pattern).test(actual),
    (pattern) => `match a pattern ${pattern}`
  )

  asArray(separator: string) {
    return new ArrayMatcher(
      `${this.description} as array separated by ${separator}`,
      this.zoom((value) => value.split(separator))
    )
  }

  split(separator: string) {
    return new ArrayMatcher(
      `${this.description} as array separated by ${separator}`,
      this.zoom((value) => value.split(separator))
    )
  }

  get asNumber() {
    return new NumberMatcher(
      this.description,
      this.zoom((value) => parseFloat(value))
    )
  }
}

export class ArrayMatcher<D, T> extends Matcher<D, Array<T>> {
  contains = this.assert(
    (actual, entries: T[]) => entries.every((element) => actual.includes(element)),
    (entries) => `contain the following elements: ${entries.join(', ')}`
  )
}

export class PathMatcher extends StringMatcher<MockRequest> {
  get lastSegment() {
    return new StringMatcher(
      `last segment of ${this.description}`,
      this.zoom((path) => {
        const segments = path.split('/')
        return decodeURIComponent(segments[segments.length - 1])
      })
    )
  }
}

export const assert = {
  request: {
    path: new PathMatcher('path', (req) => req.url.path),
    method: new StringMatcher<MockRequest>('method', (req) => req.method.toUpperCase()),
    query: new Proxy({} as Record<string, StringMatcher<MockRequest>>, {
      get(_target, p, _receiver) {
        return new StringMatcher<MockRequest>(`query["${p.toString()}"]`, (req) => req.url.query[p.toString()])
      },
    }),
    headers: new Proxy({} as Record<string, StringMatcher<MockRequest>>, {
      get(_target, p, _receiver) {
        return new StringMatcher<MockRequest>(`header["${p.toString()}"]`, (req) => req.headers[p.toString()])
      },
    }),
  },
  response: {
    status: new NumberMatcher<MockResponse>('status code', (res) => res.status),
  },
}
