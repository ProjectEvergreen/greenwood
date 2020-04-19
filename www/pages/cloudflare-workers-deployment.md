## Cloudflare Workers Deployment

[Cloudflare Workers](https://workers.cloudflare.com/) is an excellent option as a CDN for deploying your Greenwood site, though if your are new to using this service consider deploying with [Netlify](https://www.netlify.com) as it is a simpler process.

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
workers_dev = true
route = ""
zone_id = ""

[site]
bucket = "./public" //where greenwood generates the compiled code
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
