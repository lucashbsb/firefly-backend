import pino from 'pino'
import { config, isDevelopment } from '../config'

const isPretty = isDevelopment && process.env.LOG_PRETTY !== 'false'
const level = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info')

export const logger = pino(
  {
    level,
    base: {
      service: 'english-teacher-backend',
      env: config.nodeEnv
    },
    timestamp: pino.stdTimeFunctions.isoTime
  },
  isPretty
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      })
    : undefined
)
