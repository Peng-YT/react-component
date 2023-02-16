var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';
import { createRequire } from 'module';
var __dirname = dirname(fileURLToPath(import.meta.url));
var require = createRequire(import.meta.url);
var pkg = require('./package.json');
var formats = pkg.buildOpts.formats;
var outputDirs = pkg.files;
var entriesFileName = pkg.buildOpts.entries;
var external = Object.keys(__assign(__assign({}, pkg.dependencies), pkg.devDpendencies));
var removeAfterfix = function (fileName) {
    var paths = fileName.split('.');
    var afterfix = paths[paths.length - 1];
    return fileName.slice(0, -afterfix.length - 1);
};
var getPkgName = function () {
    var paths = pkg.name.split('/');
    return paths[paths.length - 1];
};
var getOpts = function (format, ouputDir) {
    var isBrowser = format === 'module' || format === 'iife';
    var plugins = [
        typescript({
            tsconfig: './tsconfig.json'
        }),
        postcss({
            extract: 'css/index.css',
            modules: true
        })
    ];
    if (format === 'cjs' || format === 'commonjs') {
        plugins.push(require('@rollup/plugin-commonjs')({}));
        plugins.push(require('@rollup/plugin-node-resolve').nodeResolve());
    }
    return {
        external: isBrowser ? undefined : external,
        output: isBrowser ? {
            format: format,
            file: "".concat(getPkgName(), ".js"),
            name: pkg.buildOpts.varName
        } : {
            entryFileNames: '[name].js',
            format: format,
            /* manualChunks(res) {
                if(res.includes('node_modules')) {
                    return 'vendor'
                }
            }, */
            dir: ouputDir
        },
        treeshake: false,
        plugins: plugins,
        input: entriesFileName.reduce(function (prev, cur) {
            var _a;
            return __assign(__assign({}, prev), (_a = {}, _a[removeAfterfix(cur)] = "./src/".concat(cur), _a));
        }, {})
    };
};
var buildOpts = formats.map(function (format, idx) {
    var outDir = outputDirs[idx] || format;
    return getOpts(format, outDir);
});
export default buildOpts;
