import fs from "fs";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";
import cp from "child_process";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
// console.log(import.meta.url, new URL(".", import.meta.url), fileURLToPath(import.meta.url), dirname(fileURLToPath(import.meta.url)))
const removeAfterfix = (fileName) => {
    const paths = fileName.split(".");
    const afterfix = paths[paths.length - 1];
    return fileName.slice(0, afterfix.length + 1);
};
const pkgs = fs.readdirSync(resolve(__dirname, "./packages"));
/* const buildConfigBuffer = fs.readFileSync(resolve(__dirname, "./buildOpts.ts"));
const buildConfigStr = buildConfigBuffer.toString("utf-8");
const createConfigFile = pkgs.map((pkg) => {
    const filename = resolve(__dirname, `./packages/${pkg}/rollup.config.ts`);
    fs.writeFileSync(filename, buildConfigStr);
    return filename;
}); */
pkgs.map((pkg) => {
    // const command = `tsc ${filename} -m esnext --esModuleInterop --moduleResolution node && rollup --config ${removeAfterfix(filename)}.js`
    /* const command = `tsc ${filename} -m esnext --esModuleInterop --moduleResolution node` */
    const command = `${resolve(__dirname, './node_modules/.bin/rollup')} --config ${resolve(__dirname, "./buildOpts.ts")} --configPlugin rollup-plugin-typescript2`
    cp.exec(
        command,
        {
            cwd: resolve(__dirname, `./packages/${pkg}`)
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
