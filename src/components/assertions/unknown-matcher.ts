import { Matcher } from './matcher.js'
import { ArrayMatcher } from './array-matcher.js'
import { BooleanMatcher } from './boolean-matcher.js'
import { NumberMatcher } from './number-matcher.js'
import { RecordMatcher } from './record-matcher.js'
import { StringMatcher } from './string-matcher.js'
import { AssertionError } from './assertion-error.js'

function assertRecord(value: unknown): value is Record<string, any> {
  if (typeof value !== 'object' || value === null || value === undefined) {
    throw new AssertionError(`be a record, instead got ${typeof value}`)
  }

  return true
}

function assertArray(value: unknown): value is Array<any> {
  if (!Array.isArray(value)) {
    throw new AssertionError(`be an array, instead got ${typeof value}`)
  }

  return true
}

function assertString(value: unknown): value is string {
  if (typeof value !== 'string') {
    throw new AssertionError(`be a string, instead got ${typeof value}`)
  }

  return true
}

function assertNumber(value: unknown): value is number {
  if (typeof value !== 'number') {
    throw new AssertionError(`be a number, instead got ${typeof value}`)
  }

  return true
}

function assertBoolean(value: unknown): value is boolean {
  if (typeof value !== 'boolean') {
    throw new AssertionError(`be a boolean, instead got ${typeof value}`)
  }

  return true
}

export class UnknownMatcher<O> extends Matcher<O, unknown> {
  get asRecord() {
    return new RecordMatcher<O>(
      this.description,
      this.zoom((value) => assertRecord(value) && value)
    )
  }

  get asArray() {
    return new ArrayMatcher<O>(
      this.description,
      this.zoom((value) => assertArray(value) && value)
    )
  }

  get asString() {
    return new StringMatcher<O>(
      this.description,
      this.zoom((value) => assertString(value) && value)
    )
  }

  get asNumber() {
    return new NumberMatcher<O>(
      this.description,
      this.zoom((value) => assertNumber(value) && value)
    )
  }

  get asBoolean() {
    return new BooleanMatcher<O>(
      this.description,
      this.zoom((value) => assertBoolean(value) && value)
    )
  }
}
