import { Lens, Matcher } from './matcher.js'
import { UnknownMatcher } from './unknown-matcher.js'

import { deepStrictEqual } from 'assert'
import { StringMatcher } from './string-matcher.js'

export class RecordMatcher<O> extends Matcher<O, Record<string, any>> {
  key(key: string) {
    return new UnknownMatcher<O>(
      `${this.description}.${key}`,
      this.zoom((value) => value[key]),
      this.reverseLens
    )
  }

  deepEquals = this.makeAssertion(
    (actual, other: Record<string, any>) => {
      try {
        deepStrictEqual(actual, other)

        return true
      } catch (e) {
        return false
      }
    },
    (other) => `deep equal ${JSON.stringify(other)}`
  )
}

export class RecordProxyMatcher<O> {
  [key: string]: StringMatcher<O>

  constructor(description: string, lens: Lens<O, Record<string, any>>) {
    return new Proxy(this, {
      get(target, p, receiver) {
        return new StringMatcher(`${description}[${p.toString()}]`, (v: O) => lens(v)[p.toString()])
      },
    })
  }
}
