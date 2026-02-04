const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args)
  },
  error: (...args: any[]) => {
    // Toujours logger les erreurs, même en prod
    console.error(...args)
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args)
  },
  info: (...args: any[]) => {
    if (isDev) console.info(...args)
  }
}
