const { map, flatten } = require('lodash')
const { table, getBorderCharacters } = require('table')

const jsonFormat = (results) => {
  return JSON.stringify(results, null, 2)
}

const tableConfig = {
  border: getBorderCharacters('norc'),
  columns: {
    0: {
      width: 30
    },
    1: {
      width: 30
    }
  },
}

const tableFormat = (results) => {
  const data = flatten(map(results, (components, moduleName) => {
    return flatten(map(components, (dependentFiles, dependent) => {
      return map(dependentFiles, (file, idx) => {
        return [
          idx === 0 ? moduleName : '',
          idx === 0 ? dependent : '',
          file
        ]
      })
    }))
  }))
  return table(data, Object.assign({}, tableConfig, {
    drawHorizontalLine: (index) => {
      return !data[index] || data[index][1] !== ''
    }
  }))
}

const formatters = {
  json: jsonFormat,
  table: tableFormat
}

module.exports = (results, format) => formatters[format](results)
