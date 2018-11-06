#!/bin/bash

mkdir -p packages

repos=(
  "admissions-web"
  "counselor-web"
  "student-web"
  "teacher-web"
  "parent-web"
  "react-my-colleges"
  "react-calendar"
  "react-components-web"
  "react-college-search"
  "scatterplot"
  "page-frame-components"
  "web-toolbox"
  "counselor-assignments"
  "react-college-details"
)
for repo in "${repos[@]}"
do
  if [ ! -d "packages/${repo}" ] ; then
    git clone "https://github.com/scoir/${repo}" "packages/${repo}"
  else
    echo "found repo ${repo}"
    (
      cd packages/${repo} && git checkout develop && git pull
    )
  fi

  (
    cd packages/${repo} && npm i
  )
done
