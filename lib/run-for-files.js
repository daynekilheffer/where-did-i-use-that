const fs = require('fs')
const path = require('path')

const runForFiles = (dir, destination, root) => {
  const dirContents = fs.readdirSync(dir)
  dirContents
    .map(handle => path.resolve(dir, handle).replace(root, '.'))
    .filter(handle => !handle.includes('node_modules'))
    .forEach(handle => {
      if (fs.lstatSync(handle).isDirectory()) {
        runForFiles(handle, destination, root)
      }
      if (/\.jsx?$/.test(handle) && !/\.spec\.jsx?$/.test(handle)) {
        destination.push(handle)
      }
    })
}


module.exports = runForFiles
