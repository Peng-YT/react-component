import { RollupOptions, ModuleFormat } from 'rollup'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import typescript from 'rollup-plugin-typescript2'
import postcss from 'rollup-plugin-postcss'
import { createRequire } from 'module'
const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const pkg = require('./package.json')
const formats = pkg.buildOpts.formats
const outputDirs = pkg.files
const entriesFileName = pkg.buildOpts.entries
const external = Object.keys({
    ...pkg.dependencies,
    ...pkg.devDpendencies
})
const removeAfterfix = (fileName: string) => {
    const paths = fileName.split('.')
    const afterfix = paths[paths.length - 1]
    return fileName.slice(0, -afterfix.length - 1)
}
const getPkgName = () => {
    const paths = pkg.name.split('/')
    return paths[paths.length - 1]
}
const getOpts = (format: ModuleFormat, ouputDir: string): RollupOptions => {
    const isBrowser = format === 'iife'
    const plugins = [
        typescript({
            tsconfig: './tsconfig.json',
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
            dir: ouputDir,
            name: pkg.buildOpts.varName,
        } : {
            entryFileNames: '[name].js',
            format,
            /* manualChunks(res) {
                if(res.includes('node_modules')) {
                    return 'vendor'
                }
            }, */
            dir: ouputDir
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