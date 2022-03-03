# Greenwood
[![Netlify Status](https://api.netlify.com/api/v1/badges/6758148c-5c38-44d8-b908-ca0a1dad0f7c/deploy-status)](https://app.netlify.com/sites/elastic-blackwell-3aef44/deploys)
[![GitHub release](https://img.shields.io/github/tag/ProjectEvergreen/greenwood.svg)](https://github.com/ProjectEvergreen/greenwood/tags)
![GitHub Actions status](https://github.com/ProjectEvergreen/greenwood/workflows/Master%20Integration/badge.svg)
[![GitHub issues](https://img.shields.io/github/issues-pr-raw/ProjectEvergreen/greenwood.svg)](https://github.com/ProjectEvergreen/greenwood/issues)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/ProjectEvergreen/greenwood/master/LICENSE.md)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

## Overview
**Greenwood** is your _workbench for the web_; focused on supporting modern web standards and development to help you create your next project. For information on getting started, reviewing our docs, or to learn more about the project and how it works, please [visit our website](https://www.greenwoodjs.io/).

Features:
- ⚡ [No bundle development](https://www.greenwoodjs.io/about/how-it-works/). Pages are built on the fly.
- 📝 HTML (and markdown) first [authoring experience](https://www.greenwoodjs.io/docs/layouts/) and ESM friendly.
- 🎁 [Optimized](https://www.greenwoodjs.io/docs/configuration/#optimization) production builds.
- 🚫 No JavaScript by default.
- 📖 Prerendering support for Web Components.
- ⚒️ Extensible via [plugins](https://www.greenwoodjs.io/plugins/).
- ⚙️ Supports [SSG, MPA, SPA, and SSR project types](https://www.greenwoodjs.io/docs/layouts/). (or a hybrid!)

> Greenwood is currently working towards a [1.0 release](https://github.com/ProjectEvergreen/greenwood/milestone/3).  If you're interested in learning more about the web and web development (at any skill level!), or interested in checking out our high level roadmap and how Greenwood got where it is today, you can read our [State of GreenwoodJS blog post](https://www.greenwoodjs.ioblog/state-of-greenwood-2022/).  We would love to have your help making Greenwood! ✌️

## Getting Started
Our website has a complete [Getting Started](http://www.greenwoodjs.io/getting-started) section that will walk you through creating a Greenwood project from scratch.

You can follow along with, or clone and go, the [companion repo](https://github.com/ProjectEvergreen/greenwood-getting-started).

## Installation
Greenwood can be installed with your favorite JavaScript package manager.
```bash
# npm
npm install @greenwood/cli --save-dev

# yarn
yarn add @greenwood/cli --dev
```

Then in your _package.json_, add the `type` field and `scripts` for the CLI, like so:
```json
{
  "type": "module",
  "scripts": {
    "build": "greenwood build",
    "start": "greenwood develop",
    "serve": "greenwood serve"
  }
}
```

- `greenwood build`: Generates a production build of your project
- `greenwood develop`: Starts a local development server for your project
- `greenwood serve`: Generates a production build of your project and runs it on a NodeJS based web server

## Documentation
All of our documentation is on our [website](https://www.greenwoodjs.io/) (which itself is built by Greenwood!).  See our website documentation to learn more about:
- Configuration
- Pages
- Templates
- Component Model
- Styles and Assets

## Contributing
We would love your [contribution](.github/CONTRIBUTING.md) to Greenwood!  Please check out our issue tracker for "good first issue" labels or feel to reach out to us on [Slack](https://join.slack.com/t/thegreenhouseio/shared_invite/enQtMzcyMzE2Mjk1MjgwLTU5YmM1MDJiMTg0ODk4MjA4NzUwNWFmZmMxNDY5MTcwM2I0MjYxN2VhOTEwNDU2YWQwOWQzZmY1YzY4MWRlOGI) in the room _"Greenwood"_ or on [Twitter](https://twitter.com/PrjEvergreen).

## Built With Greenwood
| Site  | Repo  | Project Details  |
|-------|-------|------------------|
| [The Greenhouse I/O](https://www.thegreenhouse.io/)  | [thegreenhouseio/www.thegreenhouse.io](https://github.com/thegreenhouseio/www.thegreenhouse.io)  | Personal portfolio / blog website for @thescientist13 (Greenwood maintainer). |
| [Contributary](https://www.contributary.community/)  | [ContributaryCommunity/www.contributary.community](https://github.com/ContributaryCommunity/www.contributary.community)  | A website (SPA) for browsing open source projects that are open to contributions. Built with Lit and hosted with AWS (S3 / CloudFront). |
| [Analog Studios](https://www.analogstudios.net/)  | [AnalogStudiosRI/www.analogstudios.net](https://github.com/AnalogStudiosRI/www.analogstudios.net)  | A local music studio SPA website, originally written in Angular 2, recently migrated to Lit.  It is currently transitioning to a [hybrid static + serverless website](https://github.com/AnalogStudiosRI/www.analogstudios.net/discussions/37) showing off the full potential of Greenwood and Web Components.  Follow along for all the fun! 🤘 |

> Built a site with Greenwood?  Open a PR and add it here!

## License
See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).