#!/bin/sh
set -e

# Ensure the SQLite file (expected on a mounted volume) has the current
# schema applied. Safe to run on every start — it's a no-op if already
# in sync.
node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss

exec "$@"
