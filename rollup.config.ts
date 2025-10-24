import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import { rm } from 'fs/promises'
import os from 'os'
import { defineConfig } from 'rollup'
import { fileURLToPath } from 'url'

const isProd = process.env.NODE_ENV === 'production'
const isWeb = process.env.PLATFORM === 'web'
const resolve = (id: string) => fileURLToPath(import.meta.resolve(id))

export default defineConfig({
  input: {
    extension: resolve('./src/extension.ts'),
    ...(isProd
      ? {
          vueLanguageServerMain: resolve('@vue/language-server'),
          vueTypeScriptPlugin: resolve('@vue/typescript-plugin'),
        }
      : {}),
  },
  output: {
    dir: 'dist',
    format: isWeb ? 'cjs' : 'es',
    sourcemap: !isProd,
  },
  shimMissingExports: true,
  external: ['vscode', 'typescript'],
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        __DEV__: '' + !isProd,
        __WEB__: '' + isWeb,
      },
    }),
    typescript({ sourceMap: !isProd }),
    nodeResolve({
      browser: isWeb,
      preferBuiltins: !isWeb,
    }),
    commonjs({ sourceMap: !isProd, esmExternals: ['vscode'] }),
    json(),
    isProd &&
      terser({
        maxWorkers: os.availableParallelism(),
        ecma: 2020,
        module: true,
        sourceMap: false,
      }),
    {
      name: 'clean-add',
      async buildStart() {
        await rm('dist', { recursive: true, force: true })
      },
      buildEnd() {
        if (!isProd) {
          this.emitFile({
            type: 'prebuilt-chunk',
            fileName: 'vueLanguageServerMain.js',
            code: "export * from '@vue/language-server'",
          })
        }
      },
    },
  ],
})
