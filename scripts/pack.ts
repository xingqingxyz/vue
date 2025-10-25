import { exec } from 'child_process'
import fs from 'fs/promises'
import { promisify } from 'util'

// clean
await Array.fromAsync(fs.glob('dist/*.map'), (f) => fs.unlink(f))
// proxy vsce
// await fs.rename('node_modules', '_node_modules')
try {
  await fs.mkdir('node_modules/@vue/typescript-plugin', { recursive: true })
  await fs.writeFile(
    'node_modules/@vue/typescript-plugin/index.js',
    "export * from '../../../../dist/vueTypeScriptPlugin.js'"
  )
  const packageJSON = JSON.parse(await fs.readFile('package.json', 'utf8'))
  await fs.writeFile(
    'node_modules/@vue/typescript-plugin/package.json',
    JSON.stringify({
      type: 'module',
      version: packageJSON.dependencies['@vue/typescript-plugin'].slice(1),
    })
  )
  await promisify(exec)('vsce pack -o vue.vsix')
} catch (e) {
  console.error(e)
} finally {
  await fs.rm('node_modules', { recursive: true, force: true })
  await fs.rename('_node_modules', 'node_modules')
}
