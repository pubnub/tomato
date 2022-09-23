import { singleton } from 'tsyringe'

import { readFile } from 'node:fs/promises'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve, extname, basename } from 'node:path'
import fg from 'fast-glob'

export class File {
  get extension() {
    return extname(this.path)
  }

  get filename() {
    return basename(this.path)
  }

  get parentDirectory() {
    return dirname(this.path)
  }

  get absolutePath() {
    return resolve(process.cwd(), this.path)
  }

  constructor(public readonly path: string, public readonly contents: string) {}
}

@singleton()
export class FileSystem {
  async read(path: string): Promise<File> {
    const contents = await readFile(path, 'utf-8')

    return new File(path, contents)
  }

  readSync(path: string): File {
    const contents = readFileSync(path, 'utf-8')

    return new File(path, contents)
  }

  findFile(...paths: string[]): File | null {
    for (const path of paths) {
      try {
        return this.readSync(path)
      } catch (e) {}
    }

    return null
  }

  resolveFromCwd(...fragments: string[]) {
    return resolve(process.cwd(), ...fragments)
  }

  async readFiles(globs: string | string[]) {
    return Promise.all((await fg(globs, { onlyFiles: true })).map((path) => this.read(path)))
  }
}
