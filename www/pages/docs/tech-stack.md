## Tech Stack

#### NodeJS

* [JSDOM](https://github.com/jsdom/jsdom)
* [puppeteer](https://developers.google.com/web/tools/puppeteer/)
* [Commander](https://www.npmjs.com/package/commander)

#### Web Components

Greenwood uses [LitElement](https://lit-element.polymer-project.org/) by default for all included templates and components

Other related libraries

* [lit-redux-router](https://github.com/fernandopasik/lit-redux-router) - for all routing
* [@evergreen-wc](https://github.com/hutchgrant/evergreen-web-components) component library

#### Webpack

Greenwood makes use of webpack and webpack server, along with several webpack plugins.

* babel
* webpack-dev-server
* webpack.NormalModuleReplacementPlugin
* [wc-markdown-loader](https://github.com/hutchgrant/wc-markdown-loader)
* copy-webpack-plugin
* html-webpack-plugin
* postcss-loader
* webpack-merge

#### Development

* [circleci](https://circleci.com/)
* [netlify](https://www.netlify.com/)
* [eslint](https://eslint.org/)
* [mocha](https://mochajs.org/)
* [chai](https://www.chaijs.com/)
* [istanbul](https://istanbul.js.org/)