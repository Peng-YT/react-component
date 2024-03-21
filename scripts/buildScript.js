/*
 * @Author: 彭越腾
 * @Date: 2023-11-23 11:07:15
 * @LastEditors: 彭越腾
 * @LastEditTime: 2024-03-21 11:45:04
 * @FilePath: \react-component\scripts\buildScript.js
 * @Description: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import fs from "fs";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";
import cp from "child_process";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
// console.log(import.meta.url, new URL(".", import.meta.url), fileURLToPath(import.meta.url), dirname(fileURLToPath(import.meta.url)))
const isForce = process.argv.includes('--force') || process.argv.includes('-f')
const commandPkgs = process.argv[2]?.split(',')
let pkgs = commandPkgs?.length ? commandPkgs : fs.readdirSync(resolve(__dirname, "../packages"));
/* const buildConfigBuffer = fs.readFileSync(resolve(__dirname, "./buildOpts.ts"));
const buildConfigStr = buildConfigBuffer.toString("utf-8");
const createConfigFile = pkgs.map((pkg) => {
    const filename = resolve(__dirname, `./packages/${pkg}/rollup.config.ts`);
    fs.writeFileSync(filename, buildConfigStr);
    return filename;
}); */
if (!isForce) {
    const changeFiles = cp.execSync('git status -s').toString()?.split('\n')
    pkgs = pkgs.filter((pkg) => {
        let pkgHasChange = false
        for (let i = 0; i < changeFiles.length; i++) {
            if (changeFiles[i].includes('CHANGELOG.md')) continue
            if (changeFiles[i]?.toLowerCase().includes(`packages/${pkg.toLowerCase()}`)) {
                pkgHasChange = true
                break
            }
        }
        return pkgHasChange
    })
}
if (!pkgs.length) {
    console.warn('build: No packages changed')
}
pkgs.map((pkg) => {
    // const command = `tsc ${filename} -m esnext --esModuleInterop --moduleResolution node && rollup --config ${removeAfterfix(filename)}.js`
    /* const command = `tsc ${filename} -m esnext --esModuleInterop --moduleResolution node` */
    const command = `${resolve(__dirname, '../node_modules/.bin/rollup')} --config ${resolve(__dirname, "../buildOpts.ts")} --configPlugin rollup-plugin-typescript2`
    cp.exec(
        command,
        {
            cwd: resolve(__dirname, `../packages/${pkg}`)
        },
        (error, stdout, stderr) => {
            const info = stderr || stdout
            if(!info) {
                return
            }
            console.error(`Build info:`);
            console.warn(`package -----> ${pkg}`);
            console.log("Detail -----> ", info, '\n');
        }
    )
});
