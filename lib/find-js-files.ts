import fs = require('fs')
import path = require('path')

const runForFiles = (dir: string, destination: string[], root: string) => {
  const dirContents = fs.readdirSync(dir)
  dirContents
    .map(handle => path.resolve(dir, handle).replace(root, '.'))
    .filter(handle => !handle.includes('node_modules'))
    .forEach(handle => {
      if (fs.lstatSync(handle).isDirectory()) {
        runForFiles(handle, destination, root)
      }
      if (/\.[jt]sx?$/.test(handle) && !/\.spec\.[jt]sx?$/.test(handle)) {
        destination.push(handle)
      }
    })
}


export default runForFiles
