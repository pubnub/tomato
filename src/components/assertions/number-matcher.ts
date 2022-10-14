import { Matcher } from './matcher'

export class NumberMatcher<O> extends Matcher<O, number> {
  between = this.makeAssertion(
    (actual, min: number, max: number) => actual >= min && actual <= max,
    (min, max) => `be between ${min} and ${max}`
  )
  gt = this.makeAssertion(
    (actual, value: number) => actual > value,
    (value) => `be greater than ${value}`
  )
  gte = this.makeAssertion(
    (actual, value: number) => actual >= value,
    (value) => `be greater than or equal to ${value}`
  )
  lt = this.makeAssertion(
    (actual, value: number) => actual < value,
    (value) => `be less than ${value}`
  )
  lte = this.makeAssertion(
    (actual, value: number) => actual <= value,
    (value) => `be less than or equal to ${value}`
  )
  equals = this.makeAssertion(
    (actual, value: number) => actual === value,
    (value) => `be equal to ${value}`
  )
  around = this.makeAssertion(
    (actual, value: number, epsilon: number = 0.01) => Math.abs(actual - value) < epsilon,
    (value) => `be approximately equal to ${value}`
  )
}
