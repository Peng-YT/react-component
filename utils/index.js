export async function runParallel(maxConcurrency, source, iteratorFn) {
    /**@type {Promise<void>[]} */
    const ret = []
    /**@type {Promise<void>[]} */
    const executing = []
    for (const item of source) {
        const p = Promise.resolve().then(() => iteratorFn(item))
        ret.push(p)

        if (maxConcurrency <= source.length) {
            const e = p.then(() => {
                executing.splice(executing.indexOf(e), 1)
            })
            executing.push(e)
            if (executing.length >= maxConcurrency) {
                await Promise.race(executing)
            }
        }
    }
    return Promise.all(ret)
}