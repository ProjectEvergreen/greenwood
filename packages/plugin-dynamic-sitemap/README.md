# @greenwood/plugin-dynamic-sitemap

## Overview
Spiders love to spider.  To show our love to all the spiders out there, this plugin reads 
the graph and renders a sitemap.xml.  Currently, it handles up to 10000 content entries, warning 
after 9000 content entries.

## Usage
Add this plugin to your _greenwood.config.js_ and spread the `export`.  

```javascript
import { greenwoodPluginDynamicExport } from '@greenwood/plugin-dynamic-sitemap';

export default {
  ...

  plugins: [
    greenwoodPluginDynamicExport({
      "baseUrl": "https://example.com"
    })
  ]
}
```

