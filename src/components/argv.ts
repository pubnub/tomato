import { Argv } from '#type/argv'

import Yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const yargs = await Yargs(hideBin(process.argv))
  .parserConfiguration({ 'populate--': true })
  .option('level', { alias: 'v', describe: 'logging verbosity level', type: 'count' })
  .option('port', { alias: 'p', describe: 'port that the server should bind to', type: 'number' })
  .option('watch', { alias: 'w', describe: 'reload as files change on disk', type: 'boolean' })
  .command('verify <contracts>', 'run contracts and verify requests using OpenAPI specs', (builder) =>
    builder
      .positional('contracts', { type: 'string', demandOption: true, describe: 'location of the contracts' })
      .option('openapi', { alias: 'O', describe: 'location of the OpenAPI specs', type: 'array', string: true })
  )
  .command('run <script>', 'run a script', (builder) =>
    builder.positional('script', { type: 'string', demandOption: true, describe: 'script to run' })
  )
  .help().argv

let argv: Argv

switch (yargs._[0]) {
  case 'verify':
    argv = {
      command: 'verify',
      contracts: yargs.contracts,
      openapi: yargs.openapi,
    }
    break
  case 'run':
    argv = {
      command: 'run',
      script: yargs.script,
    }
    break
  default:
    argv = { command: 'unknown' }
    break
}

export default argv
