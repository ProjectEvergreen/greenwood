TODO
1. ~~Home (JS) / Hello (.md) page (recreate POC)~~ w/ serialization
1. ~~double md?~~
1. Defaults (if directory exists)
  - pages (src/pages)
  - templates (src/pages)
  - index.html (src/index.html)
1. ~~Clean up userland~~
1. CSS
1. babel polyfill / regenerate runtime?
1. Unit testing
1. Logging
1. Add a "develop" mode (SPA mode, dev server, no serialization?)
1. move eslint to devDependency / webpack develop config?
1. `./node_modules/.bin/webpack --config ./packages/cli/config/webpack.config.prod.js --progress`
1. README

Use Cases
1. Nested pages
1. LitElement components (header)
1. LitElement pages
1. Mix of md with LitElement components?

Technical Architecture
1. local server
1. Error handling / user feedback
1. Lifecycles API
1. Define contracts / APIs between graph -> scaffold -> compile -> serialize
1. Plugins (our plugins are wrappers around webpack plugins)
  - favicon
  - bundle analyzer
1. User configurations / overrides?
 - pages
 - templates
 - index.html

If we can figure out how to make this a single "stream": _HTTP Request (graph) -> Response Body (build / scaffold) -> HTTP Response (serialize)_, we basically have our next.js.