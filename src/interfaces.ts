export interface MockResponse {
  status: number

  headers?: Record<string, string>

  body?: any
}

export interface MockRequest {
  method: 'delete' | 'get' | 'head' | 'patch' | 'post' | 'put' | 'options' | 'trace'
  url: {
    path: string
    query: Record<string, string>
    raw: string
  }

  headers: Record<string, string>

  body?: any
}

export interface ExpectInterface {
  (params: ExpectParams): Promise<RespondInterface>
}

export interface ExpectAllInterface {
  (params: ExpectAllParams[], timeout?: number): Promise<RespondInterface[]>
}

export interface ValidationFunction {
  (request: MockRequest): void
}

export interface MatchFunction {
  (request: MockRequest): boolean
}

export interface ExpectParams {
  description: string
  validations: ValidationFunction[]
}

export interface ExpectAllParams {
  description: string
  match: MatchFunction
  validations: ValidationFunction[]
}

export type RespondInterface = {
  respond(response: MockResponse): Promise<void>
  abort(): Promise<void>
} & MockRequest
