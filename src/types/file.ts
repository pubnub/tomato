export const FS = Symbol('fs')

export type FSFile = {}

export type FSOptions = {
  cwd?: string
}

export type FS = {
  read(path: string, options?: FSOptions): Promise<FSFile>
}
