const runForFiles = require('./lib/run-for-files')
const analyze = require('./lib/analyze')
const ProgressBar = require('progress')


const targetDirectories = process.argv.slice(2)
const files = []

targetDirectories.forEach(dir => {
  const fileCountBefore = files.length
  console.log(`processing files in ${dir}`)
  runForFiles(dir, files)
  const fileCountAfter = files.length
  console.log(` found ${fileCountAfter - fileCountBefore} files`)
})

console.log(`${files.length} total files`)

const bar = new ProgressBar('processing [:bar] :current/:total', { total: files.length })

const finalResult = {}

files.forEach(file => {
  analyze(file, finalResult)
  bar.tick()
})

console.log(JSON.stringify(finalResult, null, 2))
