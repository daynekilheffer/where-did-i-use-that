import findJsFiles from './lib/find-js-files'
import analyze from './lib/analyze'
import formatter from './lib/formatter'
import * as yargs from 'yargs'

const debug = require('debug')('ast')

import ProgressBar = require('progress')

const formats = ['json', 'table'] as const
const argv = yargs
  .option('format', {
    describe: 'format',
    choices: formats,
    default: formats[0]
  })
  .option('repos', {
    describe: 'repos to look at',
    demandOption: true,
    type: 'array',
  })
  .parseSync()

const searchTarget = argv._ as unknown as string
const files: string[] = [];

(argv.repos as string[]).forEach(dir => {
  const fileCountBefore = files.length
  debug(`processing files in ${dir}`)
  findJsFiles(dir, files, __dirname)
  const fileCountAfter = files.length
  debug(` found ${fileCountAfter - fileCountBefore} files`)
})

debug(`${files.length} total files`)

const bar = new ProgressBar(' processing [:bar] :current/:total ', { total: files.length })

const finalResult = files.reduce((result, file) => {
  analyze(file, result, searchTarget)
  bar.tick()
  return result
}, {})

console.log(formatter(finalResult, argv.format))
