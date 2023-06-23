# where did I use that ...? 🤔

## Background
I had a need to find out where a specific component was used in 20+ packages owned by the team.  I tried `grep`, but it was pulling back usages, wrapper components with similar names, etc.  What I wanted was an AST parser.

## Usage

### setup

```sh
cp .repos.example .repos
## update .repos with the full list of repositories in the form "org/repo"
./scripts/clone-or-reset.sh
```

### execution

```sh
npm run search -- [--package <prefix>] [--component <name>] --format [csv|json|table] --repos <directory> [<directory> ...]
```

### examples

find files using `Checkbox` from `@material-ui/core` in all repos and format as a table
```sh
npm run search -- --package @material-ui/core --component Checkbox --format table --repos packages
```

find files using any `@scoir/components-time` import
```sh
npm run search -- --package @scoir/components-time --repos packages
```

find files using a `@scoir` import in a specific sub-directory
```sh
npm run search -- --package @scoir --repos packages/my-org/my-repo/path/to/a/nested/folder
```