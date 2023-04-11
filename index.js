const findJsFiles = require('./lib/find-js-files')
const analyze = require('./lib/analyze')
const formatter = require('./lib/formatter')

const debug = require('debug')('ast')

const ProgressBar = require('progress')
const argv = require('yargs')
    .option('format', {
        describe: 'format',
        choices: ['json', 'table'],
        default: 'json'
    })
    .option('repos', {
        describe: 'repos to look at',
        demandOption: true,
        type: 'array',
    })
    .help()
    .argv

const searchTarget = argv._
const files = []

argv.repos.forEach(dir => {
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
