import babel = require('@babel/core')
import Debug from 'debug'
import { string } from 'yargs'

const debug = Debug('analyze')

const addToRecord = (record: Record<string, Record<string, string[]>>, mod: string, imp: string, file: string) => {
  record[mod] = record[mod] || {}
  record[mod][imp] = record[mod][imp] || []
  record[mod][imp].push(file)
}

const analyze = (file: string, finalResult: Record<string, Record<string, string[]>>, searchTarget: { package?: string, component?: string }) => {
  let transpiledCode
  try {
    transpiledCode = babel.transformFileSync(file, {
      filename: file,
      code: true,
      ast: true,
    })
  } catch (e) {
    console.warn(`error parsing ${file}`)
    console.warn(e)
    return
  }

  if (transpiledCode?.ast?.program.body === undefined) {
    console.warn("null transpiles code")
    return
  }

  const pkg = searchTarget.package
  const pkgMatcher = pkg ? (underTest: string) => underTest.includes(pkg) : () => true
  const component = searchTarget.component
  const componentMatcher = component ? (underTest: string) => underTest.includes(component) : () => true

  const specifiers: { name: string, as?: string, from: string }[] = []
  for (const node of transpiledCode.ast?.program.body) {
    if (node.type !== 'ImportDeclaration') {
      continue
    }
    if (!pkgMatcher(node.source.value)) {
      continue
    }

    for (const spec of node.specifiers) {
      if (spec.type === 'ImportDefaultSpecifier') {
        if (!componentMatcher(spec.local.name)) {
          continue
        }
        addToRecord(finalResult, node.source.value, 'default', file)
        debug({
          from: node.source.value,
          name: "default",
          as: spec.local.name
        })
      } else if (spec.type === 'ImportSpecifier') {
        let name = spec.local.name
        if (spec.imported?.type === 'Identifier') {
          name = spec.imported.name
        }
        if (!componentMatcher(name)) {
          continue
        }
        addToRecord(finalResult, node.source.value, name, file)
        debug({
          from: node.source.value,
          name: name,
          as: spec.local.name,
        })
      } else if (spec.type === 'ImportNamespaceSpecifier') {
        addToRecord(finalResult, node.source.value, "*", file)
        debug({
          from: node.source.value,
          name: "*",
          as: spec.local.name,
        })
      }
    }
  }

}

export default analyze
