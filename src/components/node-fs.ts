import { register } from '#di'
import { FS, FSFile, FSOptions } from '#type/file'

import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'

export class NodeFile implements FSFile {
  constructor(public absolutePath: string, public contents: string) {}
}

@register({
  singleton: true,
  as: FS,
})
export default class NodeFS implements FS {
  async read(path: string, options?: FSOptions) {
    const absolutePath = this.resolve(path, options)

    const contents = await readFile(absolutePath, 'utf-8')

    return new NodeFile(absolutePath, contents)
  }

  private resolve(path: string, options?: FSOptions) {
    return resolve(options?.cwd ?? process.cwd(), path)
  }
}
