import * as babel from "@babel/core"
import * as t from "@babel/types"

interface Processor {
  test?: (target: string) => boolean
  processDefault: (target: string, alias: string, references: number[]) => void
  processNamedImport: (target: string, name: string, alias: string | undefined, references: number[]) => void
  processNamespaceImport: (target: string, alias: string, references: number[]) => void
}

const findReferences = (ast: t.File, localName: string): number[] => {
  const references: number[] = []

  const visitor = {
    Identifier(node: t.Identifier, parent: t.Node) {
      // Skip the import declaration itself
      if (
        parent.type === "ImportDefaultSpecifier" ||
        parent.type === "ImportSpecifier" ||
        parent.type === "ImportNamespaceSpecifier"
      ) {
        return
      }

      // Check if this identifier matches our local name and has a line number
      if (node.name === localName && node.loc?.start.line) {
        references.push(node.loc.start.line)
      }
    },
  }

  const traverse = (node: t.Node | null | undefined, parent?: t.Node) => {
    if (!node) return

    if (node.type === "Identifier" && parent) {
      visitor.Identifier(node, parent)
    }

    // Traverse all properties
    for (const key in node) {
      const value = (node as any)[key]
      if (value && typeof value === "object") {
        if (Array.isArray(value)) {
          value.forEach((item) => traverse(item, node))
        } else if (value.type) {
          traverse(value, node)
        }
      }
    }
  }

  traverse(ast.program)

  return references.sort((a, b) => a - b)
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
      const references = findReferences(transpiledCode.ast as t.File, spec.local.name)

      if (spec.type === "ImportDefaultSpecifier") {
        processor.processDefault(node.source.value, spec.local.name, references)
      } else if (spec.type === "ImportSpecifier") {
        let name = spec.local.name
        if (spec.imported?.type === "Identifier") {
          name = spec.imported.name
        }
        processor.processNamedImport(node.source.value, name, spec.local.name, references)
      } else if (spec.type === "ImportNamespaceSpecifier") {
        processor.processNamespaceImport(node.source.value, spec.local.name, references)
      }
    }
  }
}
