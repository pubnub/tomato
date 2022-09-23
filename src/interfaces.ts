export interface ExpectInterface {
  (params: ExpectParams): Promise<RespondInterface>
}

export interface ValidationFunction {
  (request: MockRequest): void
}

export interface ExpectParams {
  description: string
  validations: ValidationFunction[]
}

export interface RespondInterface {
  respond(response: MockResponse): Promise<void>
}

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
  }

  headers: Record<string, string>

  body?: any
}
