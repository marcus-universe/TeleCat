#!/bin/sh
set -e

nginx

exec node --import tsx server/index.ts