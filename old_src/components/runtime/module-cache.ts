import { inject, singleton } from 'tsyringe'

import { Compiler } from '../compiler/compiler.js'
import { File } from '../file-system.js'
import { Module } from './module.js'
import { Runtime } from './runtime.js'

@singleton()
export class ModuleCache {
  private cache: Map<string, Module> = new Map()

  constructor(@inject('Compiler') private compiler: Compiler) {}

  loadModule(source: File, runtime: Runtime) {
    if (this.cache.has(source.absolutePath)) {
      return this.cache.get(source.absolutePath)
    }

    const [context] = runtime.createContext(source)
    const compiled = this.compiler.compile(source)
    const module = new Module(compiled, context)

    this.cache.set(source.absolutePath, module)

    return module
  }

  loadJson(source: File) {}
}
