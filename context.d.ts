import * as Interfaces from './src/interfaces'
import type { timetoken as _timetoken } from './src/components/runtime/context/timetoken'
import type { assert as _assert } from './src/components/runtime/context/validation'

declare global {
  var expect: Interfaces.ExpectInterface
  var timetoken: typeof _timetoken
  var assert: typeof _assert

  var json: (path: string) => any
}

export {}
