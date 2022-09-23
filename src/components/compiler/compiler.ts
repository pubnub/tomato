import { File } from '../file-system.js'

export class CompiledFile extends File {
  constructor(public readonly source: File, compiledContents: string) {
    super(source.path, compiledContents)
  }
}

export interface Compiler {
  compile(source: File): CompiledFile
}
