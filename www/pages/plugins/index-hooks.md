## Index Hooks

It is common when working with certain libraries (3rd party or otherwise) that scripts _must_ be loaded globally and / or unbundled.  Greenwood provides some prefined places in its _index.html_ that can be used to inject custom HTML which can be used to inject scripts for things like polyfills and analytics.

## Hook Types
Right now Greenwood supports the following hook types:
- `hookGreenwoodAnalytics` - For analytics libraries like [Google Analytics](https://developers.google.com/analytics/devguides/collection/analyticsjs/) or [Snowplow](https://snowplowanalytics.com/).
- `hookGreenwoodPolyfills`- Depending on what kind of polyfill needs your users require, this can be used to include things like [Web Components poyfills](https://www.webcomponents.org/polyfills).


## Usage
Below is an example of creating an index hook for loading Google Analytics from a _greenwood.config.js_.
```render javascript
module.exports = {

  ...
  
  plugins: [{
    type: 'index',
    provider: (compilation) => {
      // you can access things like config, context if you need from compilation
      return {
        hookGreenwoodAnalytics: \`
          <script>
            window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
            ga('create', 'UA-XXXXXXX', 'auto');
            ga('send', 'pageview');
          </script>
          <script async src='https://www.google-analytics.com/analytics.js'></script>
        \`
      ]
    }
  }]

}
```

### Custom Index File
It should be noted that if these specific hook types are too limiting Greenwood supports providing your own _index.html_ in the root of your workspace directory.  This can either be used to define your own hooks or just hardcode everything you need instead of using plugins.  

The minimum recommended markup for a custom _index.html_ would be this following:
```render html
<!DOCTYPE html>
<html lang="en" prefix="og:http://ogp.me/ns#">
  <head>

    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'/>
    <meta name='mobile-web-app-capable' content='yes'/>
    <meta name='apple-mobile-web-app-capable' content='yes'/>
    <meta name='apple-mobile-web-app-status-bar-style' content='black'/>

    <%= htmlWebpackPlugin.options.hookSpaIndexFallback %>

  </head>

  <body>
  
    <eve-app></eve-app>

  </body>
  
</html>
```

To add your own hook, define it in a _greenwood.config.js_
```render javascript
module.exports = {

  ...
  
  plugins: [{
    type: 'index',
    provider: (compilation) => {
      // you can access things like config, context if you need from compilation
      return {
        myCustomHook: \`
          <div>My custom HTML here</div>
        \`
      ]
    }
  }]

}
```


And updated _index.html_
```render html
<!DOCTYPE html>
<html lang="en" prefix="og:http://ogp.me/ns#">

  ...

  <body>
  
    <eve-app></eve-app>

    <%= htmlWebpackPlugin.options.myCustomHook %>

  </body>
</html>
```

> For reference, here is the [default _index.html_](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/src/templates/index.html) provided by Greenwood.  You can mix and match with your own hooks and Greenwood's hooks to support whatever best suits your needs.