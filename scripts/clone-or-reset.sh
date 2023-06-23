#!/bin/bash

mkdir -p packages

while read repo
do
  if [ ! -d "packages/${repo}" ] ; then
    git clone --depth=1 "https://github.com/${repo}" "packages/${repo}"
  else
    echo "found repo ${repo}"
    (
      cd packages/${repo} && git reset --hard origin/HEAD
    )
  fi

  # (
  #   cd packages/${repo} && npm ci
  # )
  # (
  #   if [[ -f "packages/${repo}/lerna.json" ]]; then
  #     cd packages/${repo}
  #     npx lerna bootstrap
  #   fi
  # )
done < .repos
