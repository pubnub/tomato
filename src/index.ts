#!/usr/bin/env node

import 'reflect-metadata'
import { createRequire } from 'node:module'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { serve } from './commands/serve.js'
import { loadTesting } from './commands/load-testing/index.js'

const require = createRequire(import.meta.url)

const { version } = require('../package-lock.json')

const yarg = yargs(hideBin(process.argv))
  .parserConfiguration({
    'populate--': true,
  })
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
  .command('load <contract>', 'run contract in a load test scenario', (builder) =>
    builder
      .positional('contract', { type: 'string', demandOption: 'true' })
      .option('watch', { alias: 'w', describe: 'watches and reloads contract as it changes on disk', type: 'boolean' })
      .option('port', { alias: 'p', describe: 'port that the server will bind to', type: 'number' })
      .option('level', { alias: 'v', describe: 'logging verbosity level', type: 'count' })
  )
  .help()

export type Argv = Awaited<typeof yarg.argv>

async function main() {
  const argv = await yarg.argv
  const { _, $0, ...additionalOptions } = await yargs((argv['--'] ?? []) as string[]).argv

  const [requestedCommand] = argv._

  switch (requestedCommand) {
    case 'load':
      return await loadTesting(argv, version, additionalOptions)
    case 'serve':
    default:
      return await serve(argv, version, additionalOptions)
  }
}

main()
