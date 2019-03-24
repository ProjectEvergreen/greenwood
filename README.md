By default, Greenwood will generate a site for you in _public/_.
```shell
$ greenwood
```

Fun!  But naturally you'll want to make your own pages.  So create a folder called _src/pages/_ and create a page called _index.md_.
```shell
---
path: '/hello'
label: 'hello'
template: 'page'
---


you want your own template
create src/templates/page-template, src/templates/app-template


really need to reach for a config file (assets - CopyWebpackPlugin we make our greenwood call out to webpack, more advanced)


### Hello World

This is an example page built by Greenwood.  Make your own in _src/pages_!
```

Create a page component


why?

Create a header component