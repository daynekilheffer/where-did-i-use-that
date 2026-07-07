import * as yargs from "yargs"

const debug = require("debug")("ast")

import { AuditSchema } from "./types"
import formatter, { ResultSet } from "./lib/formatter"

const formats = ["json", "table", "csv"] as const
const argv = yargs
  .option("audit", {
    describe: "audit file",
    demandOption: true,
    type: "string",
    default: "./audit.json",
  })
  .option("format", {
    describe: "format",
    choices: formats,
    default: formats[0],
  })
  .option("package", {
    describe: "package to look for",
    type: "string",
  })
  .option("component", {
    describe: "component to look for",
    type: "string",
  })
  .option("references", {
    describe: "show individual references with file:line-number format",
    type: "boolean",
    default: false,
  })
  .option("exclude-path", {
    describe: "exclude files whose path contains this substring (repeatable)",
    type: "string",
    array: true,
    default: [] as string[],
  })
  .parseSync()

const audit = require(argv.audit) as AuditSchema

const excludePaths = argv["exclude-path"] as string[]

const matchingImports = Object.entries(audit).reduce<ResultSet>((result, [file, imports]) => {
  if (excludePaths.some((path) => file.includes(path))) {
    return result
  }
  const { package: pkg, component } = argv
  if (pkg) {
    imports = imports.filter((imp) => imp.dependency.includes(pkg))
  }
  if (component) {
    imports = imports.filter((imp) => {
      return imp.type !== "name" || imp.name.includes(component)
    })
  }
  imports.forEach((imp) => {
    const working = result[imp.dependency] || {}
    let key: string = ""
    if (imp.type === "name") {
      key = imp.name
    } else if (imp.type === "default") {
      key = "default"
    } else if (imp.type === "namespace") {
      key = "*"
    }
    working[key] = working[key] || []

    // If references option is enabled and references exist, add file:line-number for each reference
    if (argv.references && imp.references && imp.references.length > 0) {
      imp.references.forEach((lineNumber) => {
        working[key].push(`${file}:${lineNumber}`)
      })
    } else {
      // Otherwise, just add the file
      working[key].push(file)
    }

    result[imp.dependency] = working
  })
  return result
}, {})

console.log(formatter(matchingImports, argv.format))
