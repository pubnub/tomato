import { Matcher } from './matcher'
import { UnknownMatcher } from './unknown-matcher'

import { deepStrictEqual } from 'assert'

export class RecordMatcher<O> extends Matcher<O, Record<string, any>> {
  key(key: string) {
    return new UnknownMatcher<O>(
      `${this.description}.${key}`,
      this.zoom((value) => value[key])
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
