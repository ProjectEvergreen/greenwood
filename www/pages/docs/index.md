---
label: 'docs'
menu: navigation
title: Docs
index: 2
---

## Documentation
This is the documentation space for **Greenwood** that we hope will help you get the most out of using it.  If this is your first time with Greenwood, we recommend checking out our [Getting Started](/getting-started/) guide to get more familiar with setting up your first Greenwood project.


### Installation
Greenwood can be installed with any of the common package managers available today.

```bash
# npm
$ npm install @greenwood/cli --save-dev

# yarn
$ yarn add @greenwood/cli --dev
```

Though we recommend installing it locally to your project, you can also run Greenwood globally.  For global usage we recommend using `npx`

```bash
$ npx @greenwood/cli@latest <command>
```

### CLI
With Greenwood installed, you can run its CLI to generate your site.  The principal commands available are:
- `greenwood develop`: Starts a local development server for your project.
- `greenwood build`: Generates a production build of your project for just static assets.
- `greenwood serve`: Generates a production build of your project and runs it on a NodeJS based web server, for both static and server renderer pages.
- `greenwood eject`: Ejects CLI configurations (Just Rollup right now) to your working directory for more advanced customization.  [YMMV](https://www.howtogeek.com/693183/what-does-ymmv-mean-and-how-do-you-use-it/).

You can define npm scripts in _package.json_ like so to automate your workflows.  You also need to define a `type` field with the value of `module`:
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

Then from the command line you can use npm or Yarn to run them:

```bash
 # start up the dev server
$ npm start
$ yarn start

# generate a static build to deploy
$ npm run build
$ yarn build

# generate a static build and preview it locally
$ npm run serve
$ yarn serve
```

### Sections

To continue learning more about Greenwood, please feel free to browse the other sections of our documentation.

- [Component Model](/docs/component-model/): Examples of using custom elements in Greenwood.
- [Configuration](/docs/configuration/): Available configuration options for the Greenwood CLI.
- [Front Matter](/docs/front-matter/): Page level configurations through page markdown.
- [Markdown](/docs/markdown/): Using markdown and related authoring capabilities supported by Greenwood.
- [Styles and Assets](/docs/css-and-images/): How to style and theme your project with CSS.
- [Templates](/docs/layouts/): Controlling the layout of your pages.
- [Tech Stack](/about/tech-stack/): What's under the hood.