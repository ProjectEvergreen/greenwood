TODO
1. ~~Home (JS) / Hello (.md) page (recreate POC)~~ w/ serialization
1. ~~double md?~~
1. Unit testing / Project linting
1. Defaults (if directory exists)
  - pages (src/pages)
  - templates (src/templates, app- <xxx>-template (page))
  - after that, just use .greenwoodrc, greenwood.config.js
  - index.html (src/index.html)
1. ~~Clean up userland~~
1. CSS
1. babel polyfill / regenerate runtime?
1. browserslist
1. webpack errors only show when running: `./node_modules/.bin/webpack --config ./packages/cli/config/webpack.config.prod.js --progress`
1. README updates
1. move config into compilation object
1. move eslint to devDependency / webpack develop config
1. User configurations / overrides?
 - pages
 - templates
 - index.html

Use Cases
1. Nested pages
1. Page Links
1. LitElement components (header)
1. LitElement pages
1. Mix of md with LitElement components?
1. Site generator

Technical Architecture
1. local server vs **webpack-dev-server** (do everything in memory)
1. Parellization
1. Add a "develop" mode (SPA mode, dev server, no serialization?)
1. Logging
1. Benchmarking --debug
1. Error handling / user feedback
1. Lifecycles API
1. Define contracts / APIs between graph -> scaffold -> compile -> serialize
1. Plugins (our plugins are wrappers around webpack plugins)
  - favicon
  - bundle analyzer
  - ESLint?

If we can figure out how to make this a single "stream": _HTTP Request (graph) -> Response Body (build / scaffold) -> HTTP Response (serialize)_, we basically have our next.js.