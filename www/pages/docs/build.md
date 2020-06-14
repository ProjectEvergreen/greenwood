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


### Babel

To override the default **babel.config.js** with your own configuration, create a new babel.config.js file within your project root directory.

> Note: If you use your own **babel.config.js** you need to include your own [.browserslist](#browserslist) file within the project's root directory

By default, [this is the babel.config.js](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/src/config/babel.config.js) being used.


### Browserslist

By default, the **.browserslistrc** file is found in the same directory as the `babel.config.js`.  If you want to override it, include a **.browserslistrc** file within your project's root directory. You are also required to include your own `babel.config.js` file if you're providing a custom **.browserslistrc**, also within your project's root directory. You can specify an alternative path to the browserslist using the `configPath` setting of your `babel-preset-env` options within your `babel.config.js` file. 

> Note: If you add a custom .browserslistrc file, you also need to include a custom babel.config.js

By default, [here is the .browserslistrc](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/src/config/.browserslistrc) being used.