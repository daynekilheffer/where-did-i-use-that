import * as yargs from "yargs"
import findJsFiles from "./lib/find-js-files"

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
  .parseSync()

const audit = require(argv.audit) as AuditSchema

const matchingImports = Object.entries(audit).reduce<ResultSet>((result, [file, imports]) => {
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
    working[key].push(file)
    result[imp.dependency] = working
  })
  return result
}, {})

console.log(formatter(matchingImports, argv.format))
