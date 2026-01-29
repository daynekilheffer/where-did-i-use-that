import { table, getBorderCharacters } from "table"

const jsonFormat = (results: ResultSet) => {
  return JSON.stringify(results, null, 2)
}

const csvFormat = (results: ResultSet) => {
  return Object.entries(results)
    .reduce<string[]>((result, [moduleName, componentUsage]) => {
      Object.entries(componentUsage).forEach(([component, files]) => {
        files.forEach((file) => {
          result.push([moduleName, component, file].join(","))
        })
      })
      return result
    }, [])
    .join("\n")
}

const tableConfig = {
  border: getBorderCharacters("norc"),
  columns: {
    0: {
      width: 30,
    },
    1: {
      width: 30,
    },
  },
}
const mapObject = <K extends string, V>(obj: Record<K, V>, fn: (value: V, key: K) => any) =>
  Object.entries(obj).map(([key, value]) => fn(value as V, key as K))
const flatten = <T = any>(arr: T[][]) => arr.reduce((result, item) => result.concat(item), [] as T[])

const tableFormat = (results: ResultSet) => {
  const data = flatten(
    mapObject(results, (components, moduleName) => {
      return flatten(
        mapObject(components, (dependentFiles, dependent) => {
          return dependentFiles.map((file, idx) => {
            return [idx === 0 ? moduleName : "", idx === 0 ? dependent : "", file]
          })
        }),
      )
    }),
  )
  return table(data, {
    ...tableConfig,
    drawHorizontalLine: (index: number) => {
      return !data[index] || data[index][1] !== ""
    },
  })
}

const formatters = {
  json: jsonFormat,
  table: tableFormat,
  csv: csvFormat,
}

// just strings, but &'ing with {} makes them unique types
type ModuleName = string & {}
type Dependent = string & {}
type Component = string & {}
export type ResultSet = Record<ModuleName, Record<Dependent, Component[]>>

export default (results: ResultSet, format: keyof typeof formatters) => {
  if (Object.keys(results).length === 0) {
    console.log()
    console.log("No data found")
    console.log()
    return
  }
  return formatters[format](results)
}
