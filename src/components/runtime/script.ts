import { File } from '../file-system.js'
import { Module } from './module.js'
import { Context } from './runtime.js'

export class Script extends Module {
  public isLegacy: boolean

  constructor(source: File, context: Context) {
    super(source, context)

    this.isLegacy = !(typeof this.exports.name === 'string' && typeof this.exports.default === 'function')
  }

  get name() {
    if (this.isLegacy) {
      return Object.keys(this.context.exports)[0]
    }

    return this.context.exports.name ?? '<unknown-name>'
  }

  getClosure(context: Context) {
    this.vm.runInContext(context)

    if (this.isLegacy) {
      return context.exports[this.name!].consumerContract
    }

    return context.exports.default
  }
}
