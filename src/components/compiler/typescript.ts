import ts from 'typescript'

import { File } from '../file-system.js'
import { Compiler, CompiledFile } from './compiler.js'

export class TypeScriptCompiler implements Compiler {
  static compilerOptions: ts.CompilerOptions = {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  }

  compile(source: File) {
    try {
      const { outputText } = ts.transpileModule(source.contents, {
        fileName: source.filename,
        compilerOptions: TypeScriptCompiler.compilerOptions,
      })

      return new CompiledFile(source, outputText)
    } catch (e) {
      throw new Error(`TypeScript compilation failed: ${e.message}`)
    }
  }
}
