# Greenwood
[![Netlify Status](https://api.netlify.com/api/v1/badges/6758148c-5c38-44d8-b908-ca0a1dad0f7c/deploy-status)](https://app.netlify.com/sites/elastic-blackwell-3aef44/deploys)
[![GitHub release](https://img.shields.io/github/tag/ProjectEvergreen/greenwood.svg)](https://github.com/ProjectEvergreen/greenwood/tags)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/ProjectEvergreen/greenwood/master/LICENSE.md)

## Overview

**Greenwood** is your _workbench for the web_, embracing web standards from the ground up to empower your stack from front to back.  For information on getting started, reviewing our docs, or to learn more about the project and how it works, please [visit our website](https://www.greenwoodjs.dev/).

Features:
- ⚡ No bundle development. Pages are built on the fly
- 📝 HTML first authoring experience and ESM friendly
- 📖 Server rendering and prerendering support for Web Components
- 📚 Build with friends like Lit, Tailwind and HTMX
- 🎁 Deploy self-hosted or to platforms like Vercel and Netlify
- ⚒️ Extensible via plugins
- ⚙️ Supports SSG, MPA, SPA, SSR and hybrid project types.  Including API Routes.

> Greenwood is currently working towards a [1.0 release](https://github.com/ProjectEvergreen/greenwood/milestone/3). We would love to have your help building Greenwood! ✌️

## Getting Started

Our website has a complete [Getting Started](http://www.greenwoodjs.dev/guides/getting-started/) guide that will walk you through creating a Greenwood project from scratch.

You can follow along with, or clone and go, the [companion repo](https://github.com/ProjectEvergreen/greenwood-getting-started) or try it out live on [Stackblitz](https://stackblitz.com/github/projectevergreen/greenwood-getting-started).

## Installation

Greenwood can be installed with your favorite JavaScript package manager.

```bash
# npm
npm i -D @greenwood/cli

# yarn
yarn add @greenwood/cli --dev

# pnpm
pnpm add -D @greenwood/cli
```

Then in your _package.json_, add the `type` field and `scripts` for the CLI:
```json
{
  "type": "module",
  "scripts": {
    "build": "greenwood build",
    "dev": "greenwood develop",
    "serve": "greenwood serve"
  }
}
```

- `greenwood build`: Generates a production build of your project
- `greenwood develop`: Starts a local development server for your project
- `greenwood serve`: Runs a production server for a production build

## Documentation

All of our documentation is on our [website](https://www.greenwoodjs.dev/), which [itself](https://github.com/ProjectEvergreen/www.greenwoodjs.dev) is built by Greenwood.

## Contributing

We would love your [contribution](.github/CONTRIBUTING.md) to Greenwood!  To get involved, you can check out our issue tracker for the ["good first issue" label](https://github.com/ProjectEvergreen/greenwood/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22), reach out to us on [Discord](https://discord.gg/bsy9jvWh), or start a discussion in our [GitHub repo](https://github.com/ProjectEvergreen/www.greenwoodjs.dev).

## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).
