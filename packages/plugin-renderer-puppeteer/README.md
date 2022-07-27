# plugin-renderer-puppeteer

## Overview

A Greenwood plugin for using [**Puppeteer**](https://pptr.dev) as a custom [_pre-rendering_ solution](/docs/server-rendering/#render-vs-prerender).  As Puppeteer is a headless browser, it provides a lot more power and capabilities for fully rendering things like Web Components, GraphQL calls, and other very browser dependent features.

### Caveats

#### Limitations
Given this plugin instruments an entire browser, this plugin _only_ supports Greenwood's [`prerender` configuration](/docs/configuration/#prerender) option and so will NOT be viable for any [SSR](/docs/server-rendering/) or [Serverless and Edge](https://github.com/ProjectEvergreen/greenwood/discussions/626) features.  Instead, Greenwood will be focusing on making [**WCC**](https://github.com/ProjectEvergreen/wcc) the default and recommended first-party solution.

#### Dependencies

You may need to install additional Operating System level libraries and dependencies depending on the system you are running on to support headless Chrome. For example, for a Docker based environment like [GitHub Actions](https://github.com/ProjectEvergreen/greenwood/blob/master/.github/workflows/master.yml#L19), you would need to add [this below setup script (or similar)](https://github.com/ProjectEvergreen/greenwood/blob/master/.github/workflows/chromium-lib-install.sh) to your runner
```shell
#!/usr/bin/bash

# path/to/your/chromium-lib-install.sh
sudo apt-get update \\
  && sudo apt-get install -yq libgconf-2-4 \\
  && sudo apt-get install -y wget --no-install-recommends \\
  && sudo wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - \\
  && sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \\
  && sudo apt-get update \\
  && sudo apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf --no-install-recommends \\
  && sudo rm -rf /var/lib/apt/lists/*
```

```yml

.
.

jobs:
 build:
   runs-on: ubuntu-latest
   steps:
      - uses: actions/checkout@v1
      - name: Install Chromium Library Dependencies
        run: |
         sh path/to/your/chromium-lib-install.sh
      - uses: actions/setup-node@v1
        with:
           node-version: "14.x"
      .
      .
```

See the Puppeteer [Troubleshooting docs](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md) for more info on setting up your specific environment.

## Installation

You can use your favorite JavaScript package manager to install this package.

```bash
# npm
npm install @greenwood/plugin-renderer-puppeteer --save-dev

# yarn
yarn add @greenwood/plugin-renderer-puppeteer --dev
```

> This package assumes you already have `@greenwood/cli` installed.

## Usage
Add this plugin to your _greenwood.config.js_.

```javascript
import { greenwoodPluginRendererPuppeteer } from '@greenwood/plugin-renderer-puppeteer';

export default {
  ...

  plugins: [
    ...greenwoodPluginRendererPuppeteer() // notice the spread!
  ]
}
```

Now, when running `greenwood build`, all your pages will get run through Puppeteer and any JavaScript / Web Components that you author will get a one time pass execution and the resulting HTML generated from that process will be captured and further optimized through Greenwood's build pipeline.