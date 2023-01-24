import { Matcher } from './matcher.js'
import { UnknownMatcher } from './unknown-matcher.js'

export class ArrayMatcher<O> extends Matcher<O, any[]> {
  contains = this.makeAssertion(
    (actual, entries: any[]) => entries.every((element) => actual.includes(element)),
    (entries) => `contain the following elements: ${JSON.stringify(entries)}`
  )

  nth(index: number) {
    return new UnknownMatcher<O>(
      `${this.description}[${index}]`,
      (value) => Array.isArray(value) && value[index],
      this.reverseLens
    )
  }
}
