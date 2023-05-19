import { map, flatten } from 'lodash'
import { table, getBorderCharacters } from 'table'

const jsonFormat = (results: ResultSet) => {
  return JSON.stringify(results, null, 2)
}

const csvFormat = (results: ResultSet) => {
  return Object.entries(results).reduce((result, [moduleName, componentUsage]) => {
    Object.entries(componentUsage).forEach(([component, files]) => {
      files.forEach((file) => {
        result.push([moduleName, component, file].join(','))
      })
    })
    return result
  }, [] as string[]).join('\n')
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

const tableFormat = (results: ResultSet) => {
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
    drawHorizontalLine: (index: number) => {
      return !data[index] || data[index][1] !== ''
    }
  }))
}

const formatters = {
  json: jsonFormat,
  table: tableFormat,
  csv: csvFormat,
}

type ResultSet = Record<string, Record<string, string[]>>

export default (results: ResultSet, format: keyof typeof formatters) => formatters[format](results)
