/*
 * @Author: 彭越腾
 * @Date: 2024-03-20 10:27:03
 * @LastEditors: 彭越腾
 * @LastEditTime: 2024-03-21 11:45:18
 * @FilePath: \react-component\scripts\createChangelog.mjs
 * @Description: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import cp from 'child_process'
import { Readable, Transform } from 'stream'
import path, { resolve } from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const commandPkgs = process.argv[2]?.split(',')
let dirs = commandPkgs?.length ? commandPkgs : fs.readdirSync(resolve(__dirname, '../packages'))
const require = createRequire(import.meta.url)
dirs.forEach((dir) => {
    const cwd = resolve(__dirname, `../packages/${dir}`)
    const pkgLocated = resolve(__dirname, `../packages/${dir}/package.json`)
    const pkg = require(pkgLocated)
    cp.execSync(
        `conventional-changelog -p angular -i ${cwd}/CHANGELOG.md -s -r 0 -k ${pkgLocated} -l ${pkg.name}@${
            pkg.version
        } -t ${pkg.name}@ -n ${resolve(__dirname, '../changelog.config.mjs')}`,
        {
            cwd,
        }
    )
})
