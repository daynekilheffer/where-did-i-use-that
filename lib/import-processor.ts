import * as babel from "@babel/core"

interface Processor {
  test?: (target: string) => boolean
  processDefault: (target: string, alias: string) => void
  processNamedImport: (target: string, name: string, alias?: string) => void
  processNamespaceImport: (target: string, alias: string) => void
}

export const processImports = (file: string, processor: Processor) => {
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

  for (const node of transpiledCode.ast?.program.body) {
    if (node.type !== "ImportDeclaration") {
      continue
    }
    if (processor.test?.(file) === false) {
      continue
    }

    for (const spec of node.specifiers) {
      if (spec.type === "ImportDefaultSpecifier") {
        processor.processDefault(node.source.value, spec.local.name)
      } else if (spec.type === "ImportSpecifier") {
        let name = spec.local.name
        if (spec.imported?.type === "Identifier") {
          name = spec.imported.name
        }
        processor.processNamedImport(node.source.value, name, spec.local.name)
      } else if (spec.type === "ImportNamespaceSpecifier") {
        processor.processNamespaceImport(node.source.value, spec.local.name)
      }
    }
  }
}
