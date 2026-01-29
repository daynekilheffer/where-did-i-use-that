# where did I use that ...? 🤔

## Background

I had a need to find out where a specific component was used in 20+ packages owned by the team. I tried `grep`, but it was pulling back usages, wrapper components with similar names, etc. What I wanted was an AST parser.

## Usage

### setup

create a list of repositories that you want to search

```sh
cp .repos.example .repos
```

I usually use something like this with `gh` to get started

```sh
## update [my-org] below before executing
## results are available on your copyboard
(
  gh repo list [my-org] --language JavaScript --limit 1000 --json nameWithOwner -q '.[].nameWithOwner'
  gh repo list [my-org] --language TypeScript --limit 1000 --json nameWithOwner -q '.[].nameWithOwner'
) | sort -u | pbcopy
```

clone the repos locally

```sh
./scripts/clone-or-reset.sh
```

### create an audit file

```sh
npm run audit:create -- --repos packages/*/* --out audit.json
```

### execution a search

```sh
npm run audit:search -- [--package <prefix>] [--component <name>] --format [csv|json|table]
```

### examples

find files using `Checkbox` from `@material-ui/core` in all repos and format as a table

```sh
npm run audit:search -- --package @material-ui/core --component Checkbox --format table
```

find files using any `@my-org/components-xyz` import

```sh
npm run audit:search -- --package @my-org/components-xyz
```

find files and references using imports from `Checkbox` from `@material-ui/core`

_note_: this is useful for use in vscode when cmd-click opens the reference to that line

```sh
npm run audit:search -- --package @material-ui/core --component Checkbox --format table --references
```
