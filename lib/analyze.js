const babel = require('babel-core')

const { filter, reduce, each } = require('lodash')

const analyze = (file, finalResult, searchTarget) => {
  const transpiledCode = babel.transformFileSync(file, {
    filename: file,
    babelrc: true,
    code: false,
    ast: true,
  })
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
