import { Matcher } from './matcher.js'
import { ArrayMatcher } from './array-matcher.js'
import { NumberMatcher } from './number-matcher.js'
import { RecordMatcher } from './record-matcher.js'

export class StringMatcher<O> extends Matcher<O, string> {
  startsWith = this.makeAssertion(
    (actual, prefix: string) => actual.startsWith(prefix),
    (prefix) => `start with "${prefix}"`,
    true
  )

  endsWith = this.makeAssertion(
    (actual, postfix: string) => actual.endsWith(postfix),
    (postfix) => `end with "${postfix}"`,
    true
  )

  isOneOf = this.makeAssertion(
    (actual, entries: string[]) => entries.includes(actual),
    (entries) => `be one of ${entries.map((entry) => `"${entry}"`).join(', ')}`,
    true
  )

  matches = this.makeAssertion(
    (actual, pattern: string | RegExp, flags?: string) =>
      (typeof pattern === 'string' ? new RegExp(pattern, flags) : pattern).test(actual),
    (pattern) => `match a pattern ${pattern}`,
    true
  )

  asArray(separator: string) {
    return new ArrayMatcher(
      `${this.description} as array separated by ${separator}`,
      this.zoom((value) => value.split(separator)),
      this.reverseLens
    )
  }

  split(separator: string) {
    return new ArrayMatcher(
      `${this.description} as array separated by "${separator}"`,
      this.zoom((value) => value.split(separator)),
      this.reverseLens
    )
  }

  get length() {
    return new NumberMatcher(
      `length of ${this.description}`,
      this.zoom((value) => value.length),
      this.reverseLens
    )
  }

  get asNumber() {
    return new NumberMatcher(
      this.description,
      this.zoom((value) => parseFloat(value)),
      this.reverseLens
    )
  }

  get asRecord() {
    return new RecordMatcher(
      this.description,
      this.zoom((value) => JSON.parse(value)),
      this.reverseLens
    )
  }
}
