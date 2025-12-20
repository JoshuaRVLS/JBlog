#!/bin/bash
# Simple wrapper to start with tsx
cd "$(dirname "$0")"
exec node_modules/.bin/tsx index.ts

