import pinoHttp from 'pino-http'
import { randomUUID } from 'crypto'
import { logger } from '../lib/logger'

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const headerId = req.headers['x-request-id']
    const requestId = (Array.isArray(headerId) ? headerId[0] : headerId) || randomUUID()
    res.setHeader('x-request-id', requestId)
    return requestId
  },
  customLogLevel: (_req, res, err) => {
    if (err) return 'error'
    if (res.statusCode >= 500) return 'error'
    return 'silent'
  },
  serializers: {
    req: (req: any) => ({
      method: req.method,
      url: req.url,
      body: req.raw?.body
    }),
    res: (res: any) => ({
      statusCode: res.statusCode
    }),
    err: (err: any) => ({
      message: err.message,
      stack: err.stack
    })
  }
})
