/*
 * @Author: 彭越腾
 * @Date: 2024-03-20 17:18:26
 * @LastEditors: 彭越腾
 * @LastEditTime: 2024-03-21 01:46:29
 * @FilePath: \react-component\changelog.config.mjs
 * @Description: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import path, { join, resolve } from 'path'
import compareFunc from 'compare-func'
import semver from 'semver'
import { fileURLToPath } from 'url'
import { readFile } from 'fs/promises'
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkg = createRequire(import.meta.url)(path.resolve(process.cwd(), 'package.json'))
const pkgName = pkg.name
const regex = /tag:\s*(.+?)[,)]/gi
function lernaTag(tag, pkg) {
    if (pkg && !tag.startsWith(`${pkg}@`)) {
        return false
    }

    return /^.+@[0-9]+\.[0-9]+\.[0-9]+(-.+)?$/.test(tag)
}
function gitSemverTags(opts = {}) {
    const options = {
        maxBuffer: Infinity,
        cwd: process.cwd(),
        ...opts,
    }
    const data = execSync('git log --decorate --no-color --date-order', options)
    const tags = []
    let match
    let tag

    data.toString()
        .split('\n')
        .forEach((decorations) => {
            while ((match = regex.exec(decorations))) {
                tag = match[1]

                if (lernaTag(tag, options.package)) {
                    tags.push(tag)
                }
            }
        })
    return tags
}
function guessNextTag(previousTag, version) {
    if (previousTag) {
        if (previousTag[0] === 'v' && version[0] !== 'v') {
            return 'v' + version
        }

        if (previousTag[0] !== 'v' && version[0] === 'v') {
            return version.replace(/^v/, '')
        }

        return version
    }

    if (version[0] !== 'v') {
        return 'v' + version
    }

    return version
}
export default {
    writerOpts: {
        /* groupBy: 'type',
        commitGroupsSort: 'title',
        commitsSort: ['scope', 'subject'],
        noteGroupsSort: 'title',
        notesSort: compareFunc, */
        groupBy: 'type',
        commitsSort: 'header',
        noteGroupsSort: 'title',
        notesSort: 'text',
        debug: () => {},
        reverse: false,
        includeDetails: false,
        ignoreReverted: true,
        lernaPackage: pkgName,
        doFlush: true,
        /* generateOn: (commit) => {
            return semver.valid(commit.version)
        }, */
        /* generateOn: (commit) => {
            if (!commit.version) {
                return false
            }
            return lernaTag(commit.version, pkgName)
        }, */
        finalizeContext: (context, a, b, keyCommit, originalCommits) => {
            const simplePkgName = pkgName.includes('/') ? pkgName.split('/')[1] : pkgName
            const possiblePkgName = simplePkgName
                .split('-')
                .map((item) => {
                    return item[0].toUpperCase() + item.slice(1)
                })
                .join('')

            context.commitGroups.map((item) => {
                return (item.commits = item.commits.filter((item) => {
                    const changeFiles = execSync(`git show ${item.hash} --raw`)
                        .toString()
                        .replace(/packages\/.*?\/CHANGELOG.md/g, '')

                    return (
                        changeFiles.includes(`packages/${simplePkgName}`) ||
                        changeFiles.includes(`packages/${possiblePkgName}`)
                    )
                }))
            })

            return context
        },
    },
}
