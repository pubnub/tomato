import c from 'ansi-colors'

import { formatTimestamp, numberExists, stringExists } from './utils.js'
import { colorMap, levelToString } from './log-level.js'

export function formatter(data: Record<string, unknown>): string {
  let line = ''

  if (numberExists(data, 'timestamp')) {
    line += c.dim(`[${formatTimestamp(data.timestamp)}]`) + ' '
  }

  if (numberExists(data, 'level')) {
    line += c[colorMap[data.level]](levelToString(data.level).padEnd(5, ' ')) + ' '
  }

  if (stringExists(data, 'module')) {
    line += c.dim(`[${data.module}]`) + ' '
  }

  if (stringExists(data, 'script')) {
    line += c.dim.italic(`[${data.script}]`) + ' '
  }

  if (stringExists(data, 'reqId')) {
    line += c.dim(`[${data.reqId}]`) + ' '
  }

  if (stringExists(data, 'msg')) {
    if (!stringExists(data, 'reqId')) {
      line += data.msg + ' '
    }
  }

  if (!data.err && data.req && stringExists(data.req, 'method') && stringExists(data.req, 'url')) {
    line += `${c.italic(data.req.method)} ${data.req.url} `
  }

  if (!data.err && data.res && numberExists(data.res, 'statusCode')) {
    let status = data.res.statusCode
    let color: 'red' | 'green' = status < 200 || status > 299 ? 'red' : 'green'

    if (numberExists(data, 'responseTime')) {
      line += `${c[color](`${status}`)} ${c.italic(data.responseTime.toFixed(4))}ms `
    }
  }

  if (data.err) {
    if (stringExists(data.err, 'type')) {
      line += `${data.err.type}: `
    }

    if (stringExists(data.err, 'name')) {
      line += `${data.err.name}: `
    }

    if (stringExists(data.err, 'message')) {
      line += `${data.err.message} `
    }

    if (stringExists(data.err, 'stack')) {
      for (const errorLine of data.err.stack.split('\n').slice(1)) {
        line += `\n${errorLine}`
      }
    }
  }

  return line
}
