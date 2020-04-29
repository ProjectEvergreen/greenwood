---
title: 'Cloudflare Workers Deployment'
menu: side
linkheadings: 3
---

## Cloudflare Workers Deployment

[Cloudflare Workers](https://workers.cloudflare.com/) is an excellent option as a CDN for deploying your Greenwood site, though if you are new to using this service consider deploying with [Netlify](https://www.netlify.com) as it is a simpler process.

This will require a paid account with Cloudflare (currently $5 per month) with a linked domain for custom domain and subdomains.

### Setup

You will need to globally install Cloudflare's CLI tool _Wrangler_

```render bash
yarn add global @cloudflare/wrangler
```

In the root of your project directory initialize _Wrangler_

```render bash
wrangler init
```

Authenticate your cloudflare account with:

```render bash
wrangler config
```

A _wrangler.toml_ file was generated at the root of your project directory, update it like this...

```render toml
name = "demo" //workers.dev subdomain name automatically named for the directory
type = "webpack"
account_id = "abcd12345...." //your account id

[env.production]
workers_dev = true

[site]
bucket = "./public" //where greenwood generated the compiled code
entry-point = "workers-site"
```

Compile your code

```render bash
greenwood build
```

Then push your code to Cloudflare workers

```render bash
wrangler publish
```

When completed a url for workers subdomain will be printed in your terminal.

To have automatic deployments whenever you push updates to your repo, you will need to configure GitHub actions to accomplish this, otherwise you can push updated manually but running the _build_ and _publish_ commands each time you wish to update the site.

### Automatic Deployments with GitHub Actions

Add the email address associated with your account and your global api key from Cloudflare to the repositories GitHub secrets.

At the root of your project add '.github/workflows/main.yml'

```render yml
name: Deploy production site

on:
  push:
      branches:
        - master
jobs:
 build:
   runs-on: ubuntu-latest
   steps:
      - uses: actions/checkout@v1
      - name: Navigate to repo
        run: cd $GITHUB_WORKSPACE
      - name: Install Chromium Library Dependencies
        run: |
         sh ./.github/workflows/chromium-lib-install.sh
      - uses: actions/setup-node@v1
        with:
           node-version: "10.x"
      - name: Install deps
        run: npm install
      - name: Build docs
        run: npm run build
      - name: Publish
        uses: cloudflare/wrangler-action@1.1.0
        with:
           apiKey: \$\{\{ secrets\.\CF_WORKERS_KEY \}\}
           email: \$\{\{ secrets\.\CF_WORKERS_EMAIL \}\}
           environment: "production"
```

In the same directory as main.yml create a file 'chromium-lib-install.sh'

```render sh
#!/usr/bin/bash

sudo apt-get update \\
  && sudo apt-get install -yq libgconf-2-4 \\
  && sudo apt-get install -y wget --no-install-recommends \\
  && sudo wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - \\
  && sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \\
  && sudo apt-get update \\
  && sudo apt-get install -y google-chrome-unstable --no-install-recommends \\
  && sudo rm -rf /var/lib/apt/lists/*
```

Push your updates to your repo and the action will begin automatically. This will create a new worker with the name from the toml file -production (IE demo-production), make sure custom url is attached to this worker.
