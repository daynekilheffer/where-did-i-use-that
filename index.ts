import findJsFiles from './lib/find-js-files'
import search from './lib/search'
import formatter from './lib/formatter'
import * as yargs from 'yargs'

const debug = require('debug')('ast')

import ProgressBar = require('progress')

const formats = ['json', 'table', 'csv'] as const
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
  .option('package', {
    describe: 'package to look for',
    type: 'string',
  })
  .option('component', {
    describe: 'component to look for',
    type: 'string',
  })
  .parseSync()

const pkg = argv.package
const comp = argv.component

if (!pkg && !comp) {
  console.error("must specify either package or component")
  process.exit(1)
}

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
  search(file, result, { package: pkg, component: comp })
  bar.tick()
  return result
}, {})

console.log(formatter(finalResult, argv.format))
