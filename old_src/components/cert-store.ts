import { inject, singleton } from 'tsyringe'

import { Settings } from './settings/index.js'
import { FileSystem, File } from './file-system.js'
import { Logger } from './logger/index.js'

@singleton()
export class CertStore {
  constructor(private settings: Settings, private fs: FileSystem, @inject('CertStoreLogger') private logger: Logger) {}

  key?: File
  cert?: File

  async loadCertificates() {
    if (this.settings.server.key === undefined || this.settings.server.cert === undefined) {
      this.settings.server.https = false

      throw new Error('To use HTTPS provide paths to the certificate and key files.')
    }

    this.key = await this.fs.read(this.fs.resolveFromCwd(this.settings.server.key))
    this.cert = await this.fs.read(this.fs.resolveFromCwd(this.settings.server.cert))
  }
}
