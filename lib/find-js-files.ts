import * as fs from "fs"
import * as path from "path"

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".turbo",
  "out",
  ".storybook",
  "storybook-static",
])

const runForFiles = (dir: string, destination: string[], root: string) => {
  const dirContents = fs.readdirSync(dir)
  dirContents
    .map((handle) => path.resolve(dir, handle).replace(root, "."))
    .forEach((handle) => {
      if (fs.lstatSync(handle).isDirectory()) {
        if (!EXCLUDED_DIRS.has(path.basename(handle))) {
          runForFiles(handle, destination, root)
        }
        return
      }
      if (/\.[jt]sx?$/.test(handle) && !/\.(spec|test|d)\.[jt]sx?$/.test(handle)) {
        destination.push(handle)
      }
    })
}

export default runForFiles
