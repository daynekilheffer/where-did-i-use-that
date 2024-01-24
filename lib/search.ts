import { ResultSet } from "./formatter"
import { processImports } from "./import-processor"
import Debug from "debug"

const debug = Debug("search")

const addToRecord = (record: ResultSet, mod: string, imp: string, file: string) => {
  record[mod] = record[mod] || {}
  record[mod][imp] = record[mod][imp] || []
  record[mod][imp].push(file)
}

const search = (file: string, finalResult: ResultSet, searchTarget: { package?: string; component?: string }) => {
  const pkg = searchTarget.package
  const pkgMatcher = pkg ? (underTest: string) => underTest.includes(pkg) : () => true
  const component = searchTarget.component
  const componentMatcher = component ? (underTest: string) => underTest.includes(component) : () => true

  processImports(file, {
    test: (target: string) => pkgMatcher(target),
    processDefault(target, alias) {
      if (!componentMatcher(alias)) {
        return
      }
      addToRecord(finalResult, target, "default", file)
      debug({
        from: target,
        name: "default",
        as: alias,
      })
    },
    processNamedImport(target, name, alias) {
      if (!componentMatcher(name)) {
        return
      }
      addToRecord(finalResult, target, name, file)
      debug({
        from: target,
        name: name,
        as: alias || name,
      })
    },
    processNamespaceImport(target, alias) {
      addToRecord(finalResult, target, "*", file)
      debug({
        from: target,
        name: "*",
        as: alias,
      })
    },
  })
}

export default search
