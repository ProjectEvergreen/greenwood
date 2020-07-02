---
label: 'build'
menu: side
title: 'Build'
index: 4
linkheadings: 3
---

# Build Configurations

A number of [core build configuration files](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/src/config) can be overridden by creating each file within the root path of your project. You can also automate this task in a single command [see eject configurations](#eject-configurations).

### Babel

To override the default **babel.config.js** with your own configuration, create a new babel.config.js file within your project root directory.

> Note: If you use your own **babel.config.js** you need to include your own [.browserslist](#browserslist) file within the project's root directory

By default, [this is the babel.config.js](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/src/config/babel.config.js) being used.

> Note: [.browserslistrc](#browserslist) is used by babel and it also needs to be overwritten if you override your **babel.config.js**. You can override it in that same directory or you may also configure babel.config.js to use default `.browserslistrc` path via [configPath option](https://babeljs.io/docs/en/babel-preset-env#configpath) to path: `./node_modules/@greenwood/cli/src/config/.browserslistrc`.  [Ejecting configuration](#eject-configuration) is one way in which you can easily override both with no extra configuration.

### Browserslist

By default, the **.browserslistrc** file is found in the same directory as the `babel.config.js` and `postcss.config.js`.  If you want to override either file, include a **.browserslistrc** file within your project's root directory. You are also required to include your own `babel.config.js` and `postcss.config.js` file if you're providing a custom **.browserslistrc** within your project's root directory. You can specify an alternative path to the browserslist using the `configPath` setting of your `babel-preset-env` options within your `babel.config.js` file.

By default, [here is the .browserslistrc](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/src/config/.browserslistrc) being used.

### PostCSS

To override the default **postcss.config.js** with your own configuration, create a new postcss.config.js file within your project's root directory.

By default, [this is the postcss.config.js](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/src/config/postcss.config.js) being used.

> Note: [.browserslistrc](#browserslist) is used by postcss and is also needed to be overwritten. You can override that in that same directory or you may also configure postcss-preset-env to use default `.browserslistrc` path via environement variable to: `./node_modules/@greenwood/cli/src/config/.browserslistrc`.  See [postcss-preset-env docs](https://www.npmjs.com/package/postcss-preset-env#browsers) for further information. [Ejecting configuration](#eject-configuration) is one way in which you can easily override both with no extra configuraiton.

### Webpack

The webpack config for production(`webpack.config.prod.js`) and development(`webpack.config.develop.js`) can be overridden by providing your own custom configuration within your project's directory.  You can eject the default core configurations into your project using greenwood cli [eject](#eject-configurations) command and then edit them after, which is the simplest and recommended method for modifying webpack config.  If you wish to revert back to the default provided configuration, simply delete these 2 files from your project's root directory. 
A number of core build configuration files can be overridden by creating each file within the root path of your project.

### Eject Configurations

From greenwood CLI you can eject [core configuration files(webpack, postcss, babel, browserslistrc)](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/src/config) into your project's working directory which will make it easier to add your own customizations.  To do so, add the following to your package.json `scripts` object:

**package.json**

```js
{
  "scripts": {
    "eject":  "greenwood eject --all",
  }
}

```

> Note: The `--all` option is to eject all config files. If you only want to eject webpack config files, remove the `--all`

You can then run:

```bash
$ npm run eject
```

To run the eject task which copies all the configuration files into your project's working directory.
