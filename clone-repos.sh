#!/bin/bash

mkdir -p packages

while read repo
do
  if [ ! -d "packages/${repo}" ] ; then
    git clone "https://github.com/${repo}" "packages/${repo}"
  else
    echo "found repo ${repo}"
    (
      cd packages/${repo} && git checkout develop && git pull
    )
  fi
  
  (
    cd packages/${repo} && npm i
  )
  (
    if [[ -f "packages/${repo}/lerna.json" ]]; then
      cd packages/${repo}
      npx lerna bootstrap
    fi
  )
done < .repos
