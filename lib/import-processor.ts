import * as babel from "@babel/core"
import * as t from "@babel/types"

interface Processor {
  test?: (target: string) => boolean
  processDefault: (target: string, alias: string, references: number[]) => void
  processNamedImport: (target: string, name: string, alias: string | undefined, references: number[]) => void
  processNamespaceImport: (target: string, alias: string, references: number[]) => void
}

const walk = (node: t.Node | null | undefined, parent: t.Node | undefined, visit: (node: t.Node, parent: t.Node) => void) => {
  if (!node) return

  if (parent) visit(node, parent)

  for (const key in node) {
    const value = (node as any)[key]
    if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        value.forEach((item) => item?.type && walk(item, node, visit))
      } else if (value.type) {
        walk(value, node, visit)
      }
    }
  }
}

const findReferences = (ast: t.File, localName: string, skip: Set<t.Node> = new Set()): number[] => {
  const references: number[] = []

  walk(ast.program, undefined, (node, parent) => {
    if (node.type !== "Identifier" || skip.has(node)) {
      return
    }

    // Skip the declaration site itself (import/export specifiers, or the bound
    // name in a `const x = require(...)`/`const x = await import(...)`)
    if (
      parent.type === "ImportDefaultSpecifier" ||
      parent.type === "ImportSpecifier" ||
      parent.type === "ImportNamespaceSpecifier" ||
      parent.type === "ExportSpecifier" ||
      parent.type === "ExportNamespaceSpecifier" ||
      (parent.type === "VariableDeclarator" && parent.id === node)
    ) {
      return
    }

    // Skip non-computed property keys (`{ palette: ... }`/`{ palette }`) — the key is a
    // label, not an expression evaluation. Without this, shorthand properties like
    // `{ palette }` double-count: babel gives the key and value distinct Identifier nodes
    // with the same name and line, so both would otherwise match as separate references.
    if (
      (parent.type === "ObjectProperty" || parent.type === "ObjectMethod") &&
      !parent.computed &&
      parent.key === node
    ) {
      return
    }

    if (node.name === localName && node.loc?.start.line) {
      references.push(node.loc.start.line)
    }
  })

  return references.sort((a, b) => a - b)
}

const unwrapAwait = (node: t.Node): t.Node => (t.isAwaitExpression(node) && node.argument ? node.argument : node)

const isModuleLoadCall = (node: t.Node): node is t.CallExpression => {
  if (!t.isCallExpression(node)) return false
  const isRequireCall = t.isIdentifier(node.callee) && node.callee.name === "require"
  const isDynamicImport = t.isImport(node.callee)
  return (isRequireCall || isDynamicImport) && t.isStringLiteral(node.arguments[0])
}

type ModuleLoadBinding =
  | { kind: "namespace"; source: string; alias: string; declNodes: t.Node[] }
  | { kind: "name"; source: string; name: string; alias: string; declNodes: t.Node[] }

// Finds `require("pkg")` and dynamic `import("pkg")` bindings anywhere in the file
// (unlike ImportDeclaration/ExportDeclaration, these aren't restricted to module top-level)
const findModuleLoadBindings = (ast: t.File): ModuleLoadBinding[] => {
  const bindings: ModuleLoadBinding[] = []

  walk(ast.program, undefined, (node) => {
    if (!t.isVariableDeclarator(node) || !node.init) {
      return
    }
    const call = unwrapAwait(node.init)
    if (!isModuleLoadCall(call)) {
      return
    }
    const source = (call.arguments[0] as t.StringLiteral).value

    if (t.isIdentifier(node.id)) {
      bindings.push({ kind: "namespace", source, alias: node.id.name, declNodes: [node.id] })
      return
    }

    if (t.isObjectPattern(node.id)) {
      node.id.properties.forEach((prop) => {
        if (!t.isObjectProperty(prop) || !t.isIdentifier(prop.key) || !t.isIdentifier(prop.value)) {
          return
        }
        bindings.push({
          kind: "name",
          source,
          name: prop.key.name,
          alias: prop.value.name,
          declNodes: [prop.value],
        })
      })
    }
  })

  return bindings
}

export const processImports = (file: string, processor: Processor) => {
  let transpiledCode
  try {
    transpiledCode = babel.transformFileSync(file, {
      filename: file,
      code: true,
      ast: true,
      // Push past isolated syntax quirks (e.g. a trailing comma after a rest element)
      // rather than discarding every import in the file over one bad line.
      parserOpts: { errorRecovery: true },
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

  const ast = transpiledCode.ast as t.File

  for (const node of ast.program.body) {
    if (node.type === "ImportDeclaration") {
      if (processor.test?.(file) === false) {
        continue
      }

      for (const spec of node.specifiers) {
        const references = findReferences(ast, spec.local.name)

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
      continue
    }

    // re-exports: `export { a, b as c } from "pkg"` / `export * as ns from "pkg"`
    if (node.type === "ExportNamedDeclaration" && node.source) {
      const line = node.loc?.start.line
      const references = line ? [line] : []

      for (const spec of node.specifiers) {
        if (spec.type === "ExportSpecifier" && spec.exported.type === "Identifier") {
          processor.processNamedImport(node.source.value, spec.local.name, spec.exported.name, references)
        } else if (spec.type === "ExportNamespaceSpecifier" && spec.exported.type === "Identifier") {
          processor.processNamespaceImport(node.source.value, spec.exported.name, references)
        }
      }
      continue
    }

    // `export * from "pkg"`
    if (node.type === "ExportAllDeclaration") {
      const line = node.loc?.start.line
      processor.processNamespaceImport(node.source.value, "*", line ? [line] : [])
      continue
    }
  }

  // CommonJS `require("pkg")` and dynamic `import("pkg")`
  for (const binding of findModuleLoadBindings(ast)) {
    const references = findReferences(ast, binding.alias, new Set(binding.declNodes))

    if (binding.kind === "namespace") {
      processor.processNamespaceImport(binding.source, binding.alias, references)
    } else {
      processor.processNamedImport(binding.source, binding.name, binding.alias, references)
    }
  }
}
