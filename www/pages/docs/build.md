---
label: 'build'
menu: side
title: 'Build'
index: 4
linkheadings: 3
---

# Build Configurations

A number of core build configuration files can be overridden by creating each file within the root path of your project.


### PostCSS

To override the default **postcss.config.js** with your own configuration, create a new postcss.config.js file within your project's root directory.

By default, the postcss.config.js being used:

```js
module.exports = {
  plugins: {
    'postcss-preset-env': {}, /// stage 2
    'postcss-nested': {},
    'cssnano': {}
  }
};

```

### Babel

To override the default **babel.config.js** with your own configuration, create a new babel.config.js file within your project root directory.

> Note: If you use your own **babel.config.js** you need to include your own [.browserslist](#browserslist) file within the project's root directory

By default, the postcss.config.js being used:

```js
module.exports = {
  
  // https://github.com/babel/babel/issues/9937#issuecomment-489352549
  sourceType: 'unambiguous',
  
  // https://github.com/babel/babel/issues/8731#issuecomment-426522500
  ignore: [/[\/\\]core-js/, /@babel[\/\\]runtime/],

  // https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md#babelpreset-env
  presets: [
    [
      // https://babeljs.io/docs/en/babel-preset-env
      '@babel/preset-env',
      {
        
        // https://babeljs.io/docs/en/babel-preset-env#usebuiltins
        useBuiltIns: 'entry',
        
        // https://babeljs.io/docs/en/babel-preset-env#corejs
        corejs: { 
          version: 3,
          proposals: true
        },

        // https://babeljs.io/docs/en/babel-preset-env#configpath
        configPath: __dirname
      }
    ]
  ],

  // https://github.com/babel/babel/issues/8829#issuecomment-456524916
  plugins: [
    [
      '@babel/plugin-transform-runtime', {
        regenerator: true
      },
      '@babel/plugin-syntax-dynamic-import'
    ]
  ]

};
```

### Browserslist

By default, the **.browserslist** file is found in the same directory as the babel.config.js.  If you want to override it, include a **.browserslist** file within your project's root directory. You can specify an alternative path to the browserslist using the `configPath` setting of your `babel-preset-env` options within your **babel.config.js** file. 

> Note: If you use a default babel.config.js you need to include your own .browserslist file within the project's root directory

By default, .browserslist is:

```js
> 1%
not op_mini all
ie 11
```