import babel = require('@babel/core')
import Debug from 'debug'

const debug = Debug('analyze')

const addToRecord = (record: Record<string, Record<string, string[]>>, mod: string, imp: string, file: string) => {
  record[mod] = record[mod] || {}
  record[mod][imp] = record[mod][imp] || []
  record[mod][imp].push(file)
}

const analyze = (file: string, finalResult: Record<string, Record<string, string[]>>, searchTarget: string) => {
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

  const specifiers: { name: string, as?: string, from: string }[] = []
  for (const node of transpiledCode.ast?.program.body) {
    if (node.type !== 'ImportDeclaration') {
      continue
    }
    if (!node.source.value.startsWith(searchTarget)) {
      continue
    }

    for (const spec of node.specifiers) {
      if (spec.type === 'ImportDefaultSpecifier') {
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
