import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino/file', options: { destination: 1 } } // stdout
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: { service: 'lcd-scanner' },
})

/** Scrape-scoped child logger */
export function scrapeLogger(scanId: string) {
  return logger.child({ scanId })
}
