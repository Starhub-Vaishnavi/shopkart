#!/bin/bash
# Starts a local MongoDB on port 27017. Leave this terminal open.
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/.mongodb/mongodb-macos-aarch64--8.3.7/bin/mongod" \
  --dbpath "$DIR/.mongodb/data" \
  --port 27017
