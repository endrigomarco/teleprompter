#!/bin/sh
set -eu
yarn db:migrate
yarn db:seed
exec "$@"
