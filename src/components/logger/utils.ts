export function isError(object: any): object is Error {
  return object instanceof Error || (object.name !== undefined && object.message !== undefined)
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)

  const hours = ('0' + date.getHours()).slice(-2)
  const minutes = ('0' + date.getMinutes()).slice(-2)
  const seconds = ('0' + date.getSeconds()).slice(-2)
  const millis = ('00' + date.getMilliseconds()).slice(-3)

  return `${hours}:${minutes}:${seconds}.${millis}`
}

export function numberExists<K extends string>(obj: any, key: K): obj is { [key in K]: number } {
  return obj[key] && typeof obj[key] === 'number'
}

export function stringExists<K extends string>(obj: any, key: K): obj is { [key in K]: string } {
  return obj[key] && typeof obj[key] === 'string'
}
