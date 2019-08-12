## Documentation

This is the documentation space for Greenwood that we hope will help you get the most out of Greenwood.  If this is your first time with Greenwood, we recommend checking out our [Getting Started](/getting-started/) guide to get more familiar with setting up your first Greenwood project.


### Installation
Greenwood can be installed with any of the common package managers available today.

```render bash
# npm
$ npm install @greenwood/cli --save-dev

# yarn
$ yarn add @greeenwood/cli --dev
```

> You can install Greenwood globally as well, though we enourage local installation of Greenwood as documented above.

### CLI
With Greenwood installed, you can run its CLI to generate your site.  The commands available are
- `develop`: Develop your project with a local development server.
- `build`: For generating a production ready static site.

As mentioend above, it is recommended installing Greenwood locally into your project. From there, you can define npm scripts in _package.json_:

```render json
"scripts": {
  "build": "greenwood build",
  "start": "greenwood develop"
},
```

Then you can run
- `npm run build` - build your project
- `npm start` - to fire up the local dev server

### Sections
- [Component Model](/docs/component-model/): Examples of using custom elements in Greenwod.
- [Configuration](/docs/configuration/): Available configuration options for the Greenwood CLI.
- [Front Matter](/docs/front-matter/): Page level configurations through page markdown.
- [Markdown](/docs/markdown/): Using markdown and related authoring capabiliies supported by Greenwood.
- [Styles and Assets](/docs/css-and-images/): How to style and theme your project with CSS.
- [Templates](/docs/layouts/): Controlling the layout of your pages.
- [Tech Stack](/docs/tech-stack/): What's under the hood.