const babel = require('@babel/core')

const { filter, reduce, each } = require('lodash')

const analyze = (file, finalResult, searchTarget) => {
  const transpiledCode = babel.transformFileSync(file, {
    filename: file,
    code: true,
    ast: true,
  })

  const specifiers = s => {
    if (s.type === 'ImportSpecifier') {
      if (s.imported.length) {
        return s.imported.map(s => s.name)
      }
      return s.imported.name
    }
    return s.local.name
  }
  const help = filter(transpiledCode.ast.program.body, node => node.type === 'ImportDeclaration').map(n => [...n.specifiers, n.specifiers.map(specifiers), n.source.value])
  console.log(filter(transpiledCode.metadata.modules.imports, item => item.source.startsWith(searchTarget)))
  if (!transpiledCode.metadata.modules) {
    return
  }

  const searchTargetImports = filter(transpiledCode.metadata.modules.imports, item => item.source.startsWith(searchTarget))

  reduce(searchTargetImports, (result, record) => {
      const mod = record.source
      result[mod] = result[mod] || {}
      each(record.imported, imported => {
        result[mod][imported] = result[mod][imported] || []
        result[mod][imported].push(file)
      })
      return result
  }, finalResult)
}

module.exports = analyze
