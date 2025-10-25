import { spawn } from 'child_process'
import fs from 'fs/promises'

let ec
// clean
await Array.fromAsync(fs.glob('dist/*.map'), (f) => fs.unlink(f))
// proxy vsce
const packageJSON = JSON.parse(await fs.readFile('package.json', 'utf8'))
await fs.rename('node_modules', '_node_modules')
try {
  await fs.mkdir('node_modules/@vue/language-server', { recursive: true })
  await fs.mkdir('node_modules/@vue/typescript-plugin', { recursive: true })
  await Promise.all([
    fs.writeFile(
      'node_modules/@vue/language-server/index.js',
      "require('../../../dist/vueLanguageServerMain.cjs')"
    ),
    fs.writeFile(
      'node_modules/@vue/typescript-plugin/index.js',
      "require('../../../dist/vueTypeScriptPlugin.cjs')"
    ),
    fs.writeFile(
      'node_modules/@vue/language-server/package.json',
      `{"version":"${packageJSON.dependencies['@vue/language-server'].slice(
        1
      )}"}`
    ),
    fs.writeFile(
      'node_modules/@vue/typescript-plugin/package.json',
      `{"version":"${packageJSON.dependencies['@vue/typescript-plugin'].slice(
        1
      )}"}`
    ),
  ])
  ec = await new Promise<number>((resolve, reject) => {
    const cp = spawn('vsce pack -o vue.vsix', { shell: true })
    cp.once('exit', resolve)
    cp.on('error', reject)
  })
} catch (e) {
  console.error(e)
} finally {
  await fs.rm('node_modules', { recursive: true, force: true })
  await fs.rename('_node_modules', 'node_modules')
}
if (ec) {
  console.error('exited with:', ec)
  process.exit(ec)
}
