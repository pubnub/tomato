#!/usr/bin/env node

import 'reflect-metadata'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { serve } from './commands/serve.js'

const yarg = yargs(hideBin(process.argv))
  .command(['serve', '$0'], 'start the mock server', (builder) =>
    builder
      .option('level', { alias: 'v', describe: 'logging verbosity level', type: 'count' })
      .option('port', { alias: 'p', describe: 'port that the server will bind to', type: 'number' })
      .option('contracts', { alias: 'C', describe: 'location of the contract files', type: 'array', string: true })
      .option('openapi', { alias: 'O', describe: 'location of the OpenAPI specs', type: 'array', string: true })
      .option('watch', {
        alias: 'w',
        describe: 'watches and reloads contracts and OpenAPI specs as they change on disk',
        type: 'boolean',
      })
  )
  .help()

export type Argv = Awaited<typeof yarg.argv>

async function main() {
  const argv = await yarg.argv

  const [requestedCommand] = argv._

  switch (requestedCommand) {
    case 'serve':
    default:
      return await serve(argv)
  }
}

main()
