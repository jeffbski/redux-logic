#!/bin/bash

set -e

for example in examples/*
do
  if [ -d "$example" ]
  then
    echo "updating ${example}..."
    pushd "${example}"
    npm i -S redux-logic@latest
    # npm i -S "rxjs@^5.5.12"
    popd
  fi
done

for example in examples/*
do
  if [ -d "$example" ]
  then
    grep "redux-logic" "${example}/package.json"
    # grep "rxjs" "${example}/package.json"
  fi
done
