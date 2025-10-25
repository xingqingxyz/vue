import path from 'path'
import { startServer } from '../../node_modules/@vue/language-server/lib/server'

let tsPath
for (const arg of process.argv) {
  if (arg.startsWith('--tsdk=')) {
    const tsdk = arg.substring('--tsdk='.length)
    tsPath = path.join(tsdk, './typescript.js').replaceAll('\\', '/')
    break
  }
}
startServer(await import(tsPath ?? 'typescript'))
