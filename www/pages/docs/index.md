---
label: 'docs'
menu: navigation
title: Docs
index: 2
---

## Documentation
This is the documentation space for Greenwood that we hope will help you get the most out of using it.  If this is your first time with Greenwood, we recommend checking out our [Getting Started](/getting-started/) guide to get more familiar with setting up your first Greenwood project.


### Installation
Greenwood can be installed with any of the common package managers available today.

```bash
# npm
$ npm install @greenwood/cli --save-dev

# yarn
$ yarn add @greeenwood/cli --dev
```

Though we recommend installing it locally to your project, you can also run Greenwood globally.  For global usage we recommend using `npx`
```bash
$ npx @greenwood/cli <build>
```

### CLI
With Greenwood installed, you can run its CLI to generate your site.  The commands available are:
- `develop`: Develop your project with a local development server.
- `build`: For generating a production ready static site.

As mentioned above, it is recommended to install Greenwood locally into your project. From there, you can define npm scripts in _package.json_:

```json
"scripts": {
  "build": "greenwood build",
  "start": "greenwood develop"
},
```

Then you can run:
- `npm run build` - generate a static build of your project for production
- `npm start` - starts a development server for local development

### Sections
- [Component Model](/docs/component-model/): Examples of using custom elements in Greenwood.
- [Configuration](/docs/configuration/): Available configuration options for the Greenwood CLI.
- [Front Matter](/docs/front-matter/): Page level configurations through page markdown.
- [Markdown](/docs/markdown/): Using markdown and related authoring capabilities supported by Greenwood.
- [Styles and Assets](/docs/css-and-images/): How to style and theme your project with CSS.
- [Templates](/docs/layouts/): Controlling the layout of your pages.
- [Tech Stack](/docs/tech-stack/): What's under the hood.
