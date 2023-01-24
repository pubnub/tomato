#!/usr/bin/env node

import { register, resolve } from '#di'

import { Argv } from '#type/argv'
import { Logger } from '#type/logger'

import argv from '#component/argv'
import Config from '#component/config'
import NodeFS from '#component/node-fs'
import PineLogger, { LogLevel } from '#component/logger'

register(Argv, argv)
await resolve(NodeFS)
await resolve(Config)

const logger = await resolve<Logger>(PineLogger, { mixin: { level: LogLevel.info } })
logger.info('-=- @pubnub/tomato v%s -=-', process.env.VERSION)

try {
  // select command
} catch (e) {}
