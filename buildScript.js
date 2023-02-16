import fs from "fs";
import { fileURLToPath } from "url";
import { resolve } from "path";
import cp from "child_process";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const removeAfterfix = (fileName) => {
    const paths = fileName.split(".");
    const afterfix = paths[paths.length - 1];
    return fileName.slice(0, afterfix.length + 1);
};
const pkgs = fs.readdirSync(resolve(__dirname, "./packages"));
const buildConfigBuffer = fs.readFileSync(resolve(__dirname, "./buildOpts.ts"));
const buildConfigStr = buildConfigBuffer.toString("utf-8");
const createConfigFile = pkgs.map((pkg) => {
    const filename = resolve(__dirname, `./packages/${pkg}/rollup.config.ts`);
    fs.writeFileSync(filename, buildConfigStr);
    return filename;
});
createConfigFile.map((filename) => {
    // const command = `tsc ${filename} -m esnext --esModuleInterop --moduleResolution node && rollup --config ${removeAfterfix(filename)}.js`
    const command = `tsc ${filename} -m esnext --esModuleInterop --moduleResolution node`
    cp.exec(
        command,
        (error, stdout, stderr) => {
            const info = stderr || stdout
            if(!info) {
                return
            }
            console.error(`Build info:`);
            console.warn(`filename -----> ${filename}`);
            console.log("Detail -----> ", info, '\n');
        }
    )
});
