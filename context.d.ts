import type { ExpectInterface, MockRequest, MockResponse } from './src/interfaces'
import type { timetoken as _timetoken } from './src/components/runtime/context/timetoken'
import type {
  NumberMatcher,
  PathMatcher,
  StringMatcher,
  ArrayMatcher,
  BodyMatcher,
} from './src/components/runtime/context/validation'

type AssertInterface = {
  request: {
    path: PathMatcher
    method: StringMatcher<MockRequest>
    query: Record<string, StringMatcher<MockRequest>>
    headers: Record<string, StringMatcher<MockRequest>>
    body: BodyMatcher
  }
  response: {
    status: NumberMatcher<MockResponse>
  }
}

declare global {
  var expect: ExpectInterface
  var timetoken: typeof _timetoken
  var assert: AssertInterface

  var json: (path: string) => any
}

export type { NumberMatcher, StringMatcher, PathMatcher, ArrayMatcher,BodyMatcher, MockRequest, MockResponse, ExpectInterface }
