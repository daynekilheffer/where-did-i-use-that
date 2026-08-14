module.exports = {
    "presets": [
        "@babel/preset-react",
        // onlyRemoveTypeImports: only strip imports explicitly marked `import type`/`type X`,
        // not ones babel infers are type-only from usage — otherwise a plain
        // `import { X } from "y"` used only in type positions vanishes before we ever see it.
        ["@babel/preset-typescript", { onlyRemoveTypeImports: true }]
    ]
}