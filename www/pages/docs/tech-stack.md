## Tech Stack

#### NodeJS

* JSDOM
* puppeteer
* Commander

#### Web Components

Greenwood uses [LitElement](https://lit-element.polymer-project.org/) by default for all included templates and components

Other related libraries

* lit-redux-router - for all our routing
* @evergreen-wc component library

#### Webpack

Greenwood makes use of webpack and webpack server, along with several webpack plugins.

* webpack-dev-server
* webpack.NormalModuleReplacementPlugin
* wc-markdown-loader to parse markdown files and generate components
* copy-webpack-plugin
* html-webpack-plugin
* postcss-loader
* webpack-merge

#### Development

* circleci
* netlify
* eslint
* mocha
* chai
* nyc