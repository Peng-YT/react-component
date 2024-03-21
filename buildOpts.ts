/*
 * @Author: 彭越腾
 * @Date: 2023-11-23 11:07:15
 * @LastEditors: 彭越腾
 * @LastEditTime: 2024-03-18 18:44:48
 * @FilePath: \react-component\buildOpts.ts
 * @Description: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { RollupOptions, ModuleFormat } from 'rollup'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import typescript from 'rollup-plugin-typescript2'
import postcss from 'rollup-plugin-postcss'
import { createRequire } from 'module'
const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const cwd = process.cwd()
const pkg = require(resolve(cwd, './package.json'))
const tsconfigOpts = require(resolve(__dirname, './tsconfig.json'))
const formats = pkg.buildOpts.formats
const outputDirs = pkg.buildOpts.outputDirs || pkg.files || []
const entriesFileName = pkg.buildOpts.entries
const external = Object.keys({
    ...pkg.dependencies,
    ...pkg.devDpendencies,
    ...pkg.peerDependencies
})
const removeAfterfix = (fileName: string) => {
    const paths = fileName.split('.')
    const afterfix = paths[paths.length - 1]
    return fileName.slice(0, -afterfix.length - 1)
}
/* const getPkgName = () => {
    const paths = pkg.name.split('/')
    return paths[paths.length - 1]
} */
const getOpts = (format: ModuleFormat, outputDir: string): RollupOptions => {
    const isBrowser = format === 'iife' || format === 'amd' || format || 'umd'
    const plugins = [
        typescript({
            cwd,
            tsconfigOverride: {
                ...tsconfigOpts,
                include: [`${cwd}/src/**/*`],
                baseUrl: './',
            },
        }),
        postcss({
            extract: 'css/index.css',
            modules: true
        })
    ]
    if(format === 'cjs' || format === 'commonjs') {
        plugins.push(require('@rollup/plugin-commonjs')({}))
        plugins.push(require('@rollup/plugin-node-resolve').nodeResolve())
    }
    return {
        external: isBrowser ? undefined : external,
        output: isBrowser ? {
            format,
            dir: outputDir,
            name: pkg.buildOpts.varName,
        } : {
            entryFileNames: '[name].js',
            format,
            /* manualChunks(res) {
                if(res.includes('node_modules')) {
                    return 'vendor'
                }
            }, */
            dir: outputDir
        },
        treeshake: false,
        plugins,
        input: entriesFileName.reduce((prev, cur) => {
            return {
                ...prev,
                [removeAfterfix(cur)]: `./src/${cur}`
            }
        }, {})
    }
}

const buildOpts = formats.map((format, idx) => {
    const outDir = outputDirs[idx] || format
    return getOpts(format, outDir)
})

export default buildOpts