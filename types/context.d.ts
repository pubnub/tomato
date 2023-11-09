import type {
  ExpectAllInterface,
  ExpectInterface,
  MockRequest,
  MockResponse
} from '../src/interfaces'
import type { timetoken as _timetoken } from '../src/components/runtime/context/timetoken'

import type { StringMatcher } from '../src/components/assertions/string-matcher'
import type { UnknownMatcher } from '../src/components/assertions/unknown-matcher'
import type { RecordMatcher } from '../src/components/assertions/record-matcher'
import type { NumberMatcher } from '../src/components/assertions/number-matcher'
import type { ArrayMatcher } from '../src/components/assertions/array-matcher'
import type { BooleanMatcher } from '../src/components/assertions/boolean-matcher'

type AssertInterface = {
  request: {
    path: StringMatcher<MockRequest>
    method: StringMatcher<MockRequest>
    query: Record<string, StringMatcher<MockRequest>>
    headers: Record<string, StringMatcher<MockRequest>>
    $query: RecordMatcher<MockRequest>
    $headers: RecordMatcher<MockRequest>
    body: UnknownMatcher<MockRequest>
    rawUrl: StringMatcher<MockRequest>
  }
}

declare global {
  const expect: ExpectInterface
  const expectAll: ExpectAllInterface
  const timetoken: typeof _timetoken
  const assert: AssertInterface

  const json: (path: string) => any
  const sleep: (milliseconds: number) => Promise<void>

  const env: Record<string, string | undefined>

  namespace console {
    const log: (...args: any[]) => void
    const info: (...args: any[]) => void
    const warn: (...args: any[]) => void
    const error: (...args: any[]) => void
    const trace: (...args: any[]) => void
  }

  namespace process {
    const env: Record<string, string>
  }
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
  ExpectAllInterface,
}
