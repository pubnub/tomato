import { Matcher } from './matcher.js'
import { ArrayMatcher } from './array-matcher.js'
import { BooleanMatcher } from './boolean-matcher.js'
import { NumberMatcher } from './number-matcher.js'
import { RecordMatcher } from './record-matcher.js'
import { StringMatcher } from './string-matcher.js'
import { AssertionError } from './assertion-error.js'

function assertRecord(value: unknown): asserts value is Record<string, any> {
  if (typeof value !== 'object' || value === null || value === undefined) {
    throw new AssertionError(`be a record, instead got ${typeof value}`)
  }
}

function assertArray(value: unknown): asserts value is Array<any> {
  if (!Array.isArray(value)) {
    throw new AssertionError(`be an array, instead got ${typeof value}`)
  }
}

function assertString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new AssertionError(`be a string, instead got ${typeof value}`)
  }
}

function assertNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw new AssertionError(`be a number, instead got ${typeof value}`)
  }
}

function assertBoolean(value: unknown): asserts value is boolean {
  if (typeof value !== 'boolean') {
    throw new AssertionError(`be a boolean, instead got ${typeof value}`)
  }
}

export class UnknownMatcher<O> extends Matcher<O, unknown> {
  get asRecord() {
    return new RecordMatcher<O>(
      this.description,
      this.zoom((value) => (assertRecord(value), value)),
      this.reverseLens
    )
  }

  get asArray() {
    return new ArrayMatcher<O>(
      this.description,
      this.zoom((value) => (assertArray(value), value)),
      this.reverseLens
    )
  }

  get asString() {
    return new StringMatcher<O>(
      this.description,
      this.zoom((value) => (assertString(value), value)),
      this.reverseLens
    )
  }

  get asNumber() {
    return new NumberMatcher<O>(
      this.description,
      this.zoom((value) => (assertNumber(value), value)),
      this.reverseLens
    )
  }

  get asBoolean() {
    return new BooleanMatcher<O>(
      this.description,
      this.zoom((value) => (assertBoolean(value), value)),
      this.reverseLens
    )
  }
}
