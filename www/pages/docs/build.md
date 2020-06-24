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

By default, [this is the postcss.config.js](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/src/config/postcss.config.js) being used.

> Note: [.browserslistrc](#browserslist) is used by postcss and is also needed to be overwritten. You can override that in that same directory or you may also configure postcss-preset-env to use default `.browserslistrc` path via environement variable to: `./node_modules/@greenwood/cli/src/config/.browserslistrc`.  See [postcss-preset-env docs](https://www.npmjs.com/package/postcss-preset-env#browsers) for further information. [Ejecting configuration](#eject-configuration) is one way in which you can easily override both with no extra configuraiton.


### Babel

To override the default **babel.config.js** with your own configuration, create a new babel.config.js file within your project root directory.

> Note: If you use your own **babel.config.js** you need to include your own [.browserslist](#browserslist) file within the project's root directory

By default, [this is the babel.config.js](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/src/config/babel.config.js) being used.

> Note: [.browserslistrc](#browserslist) is used by babel and it also needs to be overwritten if you override your **babel.config.js**. You can override it in that same directory or you may also configure babel.config.js to use default `.browserslistrc` path via [configPath option](https://babeljs.io/docs/en/babel-preset-env#configpath) to path: `./node_modules/@greenwood/cli/src/config/.browserslistrc`.  [Ejecting configuration](#eject-configuration) is one way in which you can easily override both with no extra configuraiton.


### Browserslist

By default, the **.browserslistrc** file is found in the same directory as the `babel.config.js` and `postcss.config.js`.  If you want to override either file, include a **.browserslistrc** file within your project's root directory. You are also required to include your own `babel.config.js` and `postcss.config.js` file if you're providing a custom **.browserslistrc** within your project's root directory. You can specify an alternative path to the browserslist using the `configPath` setting of your `babel-preset-env` options within your `babel.config.js` file.

By default, [here is the .browserslistrc](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/src/config/.browserslistrc) being used.