export const isError = (error: any): error is NodeJS.ErrnoException => error.code && error instanceof Error
