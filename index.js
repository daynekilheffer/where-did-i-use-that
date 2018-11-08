const findJsFiles = require('./lib/find-js-files')
const analyze = require('./lib/analyze')
const formatter = require('./lib/formatter')

const ProgressBar = require('progress')
const argv = require('yargs')
    .option('format', {
        describe: 'format',
        choices: ['json', 'table'],
        default: 'json'
    })
    .help()
    .argv

const targetDirectories = argv._
const files = []

targetDirectories.forEach(dir => {
  const fileCountBefore = files.length
  console.log(`processing files in ${dir}`)
  findJsFiles(dir, files, __dirname)
  const fileCountAfter = files.length
  console.log(` found ${fileCountAfter - fileCountBefore} files`)
})

console.log(`${files.length} total files`)

const bar = new ProgressBar(' processing [:bar] :current/:total', { total: files.length })

const finalResult = files.reduce((result, file) => {
  analyze(file, result)
  bar.tick()
  return result
}, {})

console.log(formatter(finalResult, argv.format))
