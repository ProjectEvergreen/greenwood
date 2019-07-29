## Configuration

Greenwood can be customized based on your individual needs. For example, if we want to add meta data to each of our pages, or if we want a custom folder name for our workspace from the default `src` to `www` etc. These settings are available through a configuration file you can add within your project's directory called `greenwood.config.js`.


### Meta

For this guide, we will add some basic meta data to our static site.  Create a new file called `greenwood.config.js` within your project directory(outside of your `src` directory).  Within this file, we can export an object of configuration settings specifically containing the meta data we want to add to our pages.

```render js
module.exports = {
  title: 'Greenwood Example Site',
  meta: [
    { property: 'og:site', content: 'greenwood' },
    { name: 'twitter:site', content: '@PrjEvergreen' }
  ]
};
```

For more information about custom configurations see [configuration docs](/docs/configuration)



---
[Next Step: Custom Page Templates](/getting-started/custom-page-template)