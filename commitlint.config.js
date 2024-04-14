module.exports = {
    "extends": [
        "@commitlint/config-conventional",
        (...arg) => {
            console.log(arg, 'arg')
        }
    ]
}