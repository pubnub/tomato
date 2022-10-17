import type { ExpectInterface, MockRequest, MockResponse } from './src/interfaces'
import type { timetoken as _timetoken } from './src/components/runtime/context/timetoken'

import type { StringMatcher } from './src/components/assertions/string-matcher'
import type { UnknownMatcher } from './src/components/assertions/unknown-matcher'
import type { RecordMatcher } from './src/components/assertions/record-matcher'
import type { NumberMatcher } from './src/components/assertions/number-matcher'
import type { ArrayMatcher } from './src/components/assertions/array-matcher'
import type { BooleanMatcher } from './src/components/assertions/boolean-matcher'

type AssertInterface = {
  request: {
    path: StringMatcher<MockRequest>
    method: StringMatcher<MockRequest>
    query: Record<string, StringMatcher<MockRequest>>
    headers: Record<string, StringMatcher<MockRequest>>
    $query: RecordMatcher<MockRequest>
    $headers: RecordMatcher<MockRequest>
    body: UnknownMatcher<MockRequest>
  }
}

declare global {
  var expect: ExpectInterface
  var timetoken: typeof _timetoken
  var assert: AssertInterface

  var json: (path: string) => any
}

export type {
  NumberMatcher,
  StringMatcher,
  RecordMatcher,
  ArrayMatcher,
  BooleanMatcher,
  MockRequest,
  MockResponse,
  ExpectInterface,
}
