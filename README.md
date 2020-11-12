# Greenwood
[![Netlify Status](https://api.netlify.com/api/v1/badges/6758148c-5c38-44d8-b908-ca0a1dad0f7c/deploy-status)](https://app.netlify.com/sites/elastic-blackwell-3aef44/deploys)
[![GitHub release](https://img.shields.io/github/tag/ProjectEvergreen/greenwood.svg)](https://github.com/ProjectEvergreen/greenwood/tags)
![GitHub Actions status](https://github.com/ProjectEvergreen/greenwood/workflows/Master%20Integration/badge.svg)
[![GitHub issues](https://img.shields.io/github/issues-pr-raw/ProjectEvergreen/greenwood.svg)](https://github.com/ProjectEvergreen/greenwood/issues)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/ProjectEvergreen/greenwood/master/LICENSE.md)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

## Overview
Greenwood is a modern and performant static site generator supporting Web Component based development.  For more information about how to get started, lookup our docs, or learn more about the project, please visit our [website](https://www.greenwoodjs.io/).

> Greenwood is currently working towards a [1.0 release](https://github.com/ProjectEvergreen/greenwood/issues/418) with plans in our [next release (v.0.10.0)](https://github.com/ProjectEvergreen/greenwood/pull/436) to introduce some exciting [new changes and concepts](https://github.com/ProjectEvergreen/greenwood/releases/tag/v0.10.0-alpha.0) to the project.  Check out our [roadmap](https://github.com/ProjectEvergreen/greenwood/projects) to see what we're working on next and feel free to reach out through our [issue tracker](https://github.com/ProjectEvergreen/greenwood/issues) if you have any issues.  Additionally, please review our [Request for Contributions doc](https://docs.google.com/document/d/1MwDkszKvq81QgIYa8utJgyUgSpLZQx9eKCWjIikvfHU/) if would like to help us in building Greenwood! ✌️

## Getting Started
Our website has a complete [Getting Started](http://www.greenwoodjs.io/getting-started) section that will walk you through creating a Greenwood project from scratch.

You can follow along with, or clone and go, the [companion repo](https://github.com/ProjectEvergreen/greenwood-getting-started).

## Installation
Greenwood can be installed with your favorite JavaScript package manager.
```bash
# npm
npm -i @greenwood/cli --save-dev

# yarn
yarn add @greenwood/cli --dev
```

Then in your _package.json_, you can run the CLI like so:
```javascript
"scripts": {
  "build": "greenwood build",
  "start": "greenwood develop",
  "serve": "greenwood serve",
  "eject": "greenwood eject"
}
```

- `greenwood build`: Generates a production build of your project
- `greenwood develop`: Starts a local development server for your project
- `greenwood serve`: Generates a production build of the project and serves it locally on a simple web server.
- `greenwood eject`: Ejects configurations to your working directory for additional customizations.

## Documentation
All of our documentation is on our [website](https://www.greenwoodjs.io/) (which itself is built by Greenwood!).  See our website documentation to learn more about:
- Configuration
- Pages
- Templates
- Component Model
- Styles and Assets

## Contributing
We would love your [contribution](.github/CONTRIBUTING.md) to Greenwood!  Please check out our issue tracker for "good first issue" labels or feel to reach out to us on Gitter in the room "Greenwood" or on [Twitter](https://twitter.com/PrjEvergreen).

## Built With Greenwood
| Site  | Repo  | Project Details  | 
|---|---|---|
| [The Greenhouse I/O](https://www.thegreenhouse.io/)  | [https://github.com/thegreenhouseio/www.thegreenhouse.io](https://github.com/thegreenhouseio/www.thegreenhouse.io)  | Personal portfolio / blog website for @thescientist13 (Greenwood maintainer). |

> Built a site with Greenwood?  Open a PR and add it here!

## License
See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).
