#!/usr/bin/bash

set -euo pipefail

puppeteer_cache_dir="$(pwd)/.cache/puppeteer"

# install from locally supplied version by puppeteer,
# along with the system libraries required to run it on Linux
sudo apt-get update
sudo env "PATH=$PATH" PUPPETEER_CACHE_DIR="$puppeteer_cache_dir" \
  ./node_modules/.bin/puppeteer browsers install chrome --install-deps
sudo chown -R "$(id -u):$(id -g)" "$puppeteer_cache_dir"
