import { Matcher } from './matcher.js'

export class NumberMatcher<O> extends Matcher<O, number> {
  between = this.makeAssertion(
    (actual, min: number, max: number) => actual >= min && actual <= max,
    (min, max) => `be between ${min} and ${max}`,
    true
  )
  gt = this.makeAssertion(
    (actual, value: number) => actual > value,
    (value) => `be greater than ${value}`,
    true
  )
  gte = this.makeAssertion(
    (actual, value: number) => actual >= value,
    (value) => `be greater than or equal to ${value}`,
    true
  )
  lt = this.makeAssertion(
    (actual, value: number) => actual < value,
    (value) => `be less than ${value}`,
    true
  )
  lte = this.makeAssertion(
    (actual, value: number) => actual <= value,
    (value) => `be less than or equal to ${value}`,
    true
  )
  equals = this.makeAssertion(
    (actual, value: number) => actual === value,
    (value) => `be equal to ${value}`,
    true
  )
  around = this.makeAssertion(
    (actual, value: number, epsilon: number = 0.01) => Math.abs(actual - value) < epsilon,
    (value) => `be approximately equal to ${value}`,
    true
  )
}
