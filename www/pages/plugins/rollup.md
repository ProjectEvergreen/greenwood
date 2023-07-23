---
label: 'Rollup'
menu: side
title: 'Rollup'
index: 6
---

## Rollup

Though rare, there may be cases and opportunities for tapping into the bundling process for Greenwood.  If so, this plugin type allow users to tap into Greenwood's [Rollup](https://rollupjs.org/) configuration to provide any Rollup plugins you may want to use.  Simply use the `provider` method to return an array of Rollup plugins.

### Example
Install your favorite rollup plugin(s), then create a simple object to provide those plugins to Greenwood.

```javascript
import bannerRollup from 'rollup-plugin-banner';
import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

export function myRollupPlugin(options = {}) {
  const now = new Date().now();

  return {
    type: 'rollup',
    name: 'plugin-something-something',
    provider: () => [
      banner(`/* ${packageJson.name} v${packageJson.version} - built at ${now}. */`)
    ]
  };
};
```