import { MockRequest } from '../../../interfaces.js'
import { StringMatcher } from '../../assertions/string-matcher.js'
import { UnknownMatcher } from '../../assertions/unknown-matcher.js'
import { RecordMatcher } from '../../assertions/record-matcher.js'

export const assert = {
  request: {
    path: new StringMatcher<MockRequest>('path', (req) => req.url.path),
    method: new StringMatcher<MockRequest>('method', (req) => req.method.toUpperCase()),
    query: new RecordMatcher<MockRequest>('query', (req) => req.url.query),
    headers: new RecordMatcher<MockRequest>('headers', (req) => req.headers),
    body: new UnknownMatcher<MockRequest>('body', (req) => req.body),
  },
}
