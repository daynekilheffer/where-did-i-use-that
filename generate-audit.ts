import * as yargs from "yargs"
import * as fs from "fs"
import findJsFiles from "./lib/find-js-files"
import { processImports } from "./lib/import-processor"

const debug = require("debug")("ast")

import ProgressBar = require("progress")
import { AuditSchema } from "./types"

const argv = yargs
  .option("repos", {
    describe: "repos to look at",
    demandOption: true,
    type: "array",
  })
  .option("out", {
    alias: "o",
    describe: "output file",
    type: "string",
  })
  .parseSync()

let fd: number = process.stdout.fd
if (argv.out) {
  fd = fs.openSync(argv.out, "w")
}
const files: string[] = []

;(argv.repos as string[]).forEach((dir) => {
  const fileCountBefore = files.length
  debug(`processing files in ${dir}`)
  findJsFiles(dir, files, __dirname)
  const fileCountAfter = files.length
  debug(` found ${fileCountAfter - fileCountBefore} files`)
})

debug(`${files.length} total files`)

const bar = new ProgressBar(" processing [:bar] :current/:total ", {
  total: files.length,
})

const finalResult = files.reduce<AuditSchema>((result, file) => {
  result[file] = []
  processImports(file, {
    processDefault(target, alias, references) {
      result[file].push({
        type: "default",
        dependency: target,
        alias: alias,
        references: references,
      })
    },
    processNamedImport(target, name, alias, references) {
      result[file].push({
        type: "name",
        dependency: target,
        name: name,
        alias: alias,
        references: references,
      })
    },
    processNamespaceImport(target, alias, references) {
      result[file].push({
        type: "namespace",
        dependency: target,
        alias: alias,
        references: references,
      })
    },
  })
  bar.tick()
  return result
}, {})

fs.writeSync(fd, JSON.stringify(finalResult, null, 2))
fs.closeSync(fd)
