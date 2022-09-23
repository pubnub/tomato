import * as vm from 'node:vm'
import { File } from '../file-system.js'
import { Context } from './runtime.js'

export class Module {
  protected vm: vm.Script

  constructor(public source: File, protected context: Context) {
    this.vm = new vm.Script(source.contents, { filename: source.filename })
    this.vm.runInContext(context)
  }

  get exports() {
    return this.context.exports
  }
}
