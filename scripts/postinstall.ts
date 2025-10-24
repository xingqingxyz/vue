// @no-format
import fs from 'fs/promises'
import packageJSON from '../package.json' with { type: 'json' }

await fs.mkdir('build/node_modules/@vue/typescript-plugin', { recursive: true })
await Promise.all([
  fs.mkdir('dist', { recursive: true }),
  ...[
    'dist',
    'languages',
    'schemas',
    'syntaxes',
    'LICENSE',
    'package.json',
    '.vscodeignore',
  ].map((i) => fs.symlink(`../${i}`, `build/${i}`)),
  fs.symlink(
    '../../../../dist/vueTypeScriptPlugin.js',
    'build/node_modules/@vue/typescript-plugin/index.js'
  ),
  fs.writeFile(
    'build/node_modules/@vue/typescript-plugin/package.json',
    JSON.stringify({
      type: 'module',
      version: packageJSON.dependencies['@vue/typescript-plugin'].slice(1),
    })
  ),
])
