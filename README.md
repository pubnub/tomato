# `@pubnub/tomato` ![npm](https://img.shields.io/npm/v/@pubnub/tomato?style=flat-square)
> CLI mock server tool for contract testing

## Installation

    npm install @pubnub/tomato

## Usage

    npx tomato

## Configuration
 Tomato will look for a `toma.toml` configuration file in the current working directory.
 
|Option|Default|Type|Description|
|-|-|-|-|
|`port`|`8090`|`number`|Port to start the server at|
|`contracts`|`./contracts/**/*.ts`|`Glob \| Glob[]`|Location of the contract files|
|`openapi`|`./openapi/**/*.yaml`|`Glob \| Glob[]`|Location of the OpenAPI specs|
|`env`|_none_|`Record<string, string>`|Additional environment variables exposed as `process.env`|


## Contract files
Contract is a TypeScript file that:
  - exports its name: 
      
        export const name = "MyContractName"

  - exports a default _consumer_ function:

        export default async function() {}

  - optionally exports a _provider_ function:

        export async function provider() {}

### Contract context
Contracts are run inside an isolated Node.js environment and have access to some additional helpers.

#### `timetoken.now()`
Generates a string timetoken with nanosecond resolution.

#### `json(path: string)`
Read and parse a JSON file.

#### `expect({ description: string, validations?: Array<(request: Request) => void>}, number?): Promise<Request>`
Asynchronous function that waits for the next request (waits for 30000 milliseconds by default, which can be changed with the last argument) and validates it against an array of `assert` functions before returning an instance of `Request`.

#### `expectAll({ description: string, match: (request: Request) => bool, validations?: Array<(request: Request) => void>}[], number?): Promise<Request[]>`
Asynchronous function that waits for a list of next requests (waits for 30000 milliseconds by default, which can be changed with the last argument) and validates it against an array of `assert` functions before returning an array of `Request` instances.

This function is useful when a few endpoints can be called simultaneously, and it is unknown which will be accepted first by the mock server.  `match` function will be used to match the validation configuration to the proper request. The returned list of `Request` instances will be ordered in the same order as the passed parameters.

#### `Request.respond({ status: number, headers?: Record<string, string>, body?: any }): Promise<void>`
Asynchronous function that responds to a request.

#### `assert`
`assert` groups assertion functions.

##### Examples:

    // expected last segment of path to equal "hello"
    assert.request.path.lastSegment.equals('"hello"')

    // expected path to match /^\/hello/i
    assert.request.path.matches('^/hello', 'i')
    
    // expected path to start with '/v2/request/hello'
    assert.request.path.startsWith('/v2/request/hello') 

    // expected method to be one of ["GET", "POST"]
    assert.request.method.isOneOf(['GET', 'POST'])

    // expected method to equal "POST"
    assert.request.method.equals('POST')

    // expected query["lmao"] to equal "123"
    assert.request.query.lmao.equals('123')

    // expected query["tt"] to be greater than 10
    assert.request.query.tt.asNumber.gt(10) 