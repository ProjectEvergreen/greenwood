---
label: 'build'
menu: side
title: 'Build'
index: 4
linkheadings: 3
---

## Build Configurations
> ⛔ [_**More coming Soon!**_](https://github.com/ProjectEvergreen/greenwood/issues/426)

**Greenwood** offers the ability to extend some of the internal tooling used to better customize the project for those with more advanced use cases than those offered by Greenwood's default.  Greenwood is farily unopinionated in its defaults and aims to provide support for modern web standards that are >= Stage 3 (where applicable).

> _For markdown specific options, please see our docs section on [markdown](/docs/markdown/)._

### PostCSS

To provide addition configurations and optimizations around CSS, user's can add a _postcss.config.js_ file within a project's root directory to take advantage of [**PostCSS**](https://postcss.org/).

For example, if you wanted to write CSS with nested selectors, you would want do the following:

1. Install the relevant PostCSS plugin
    ```shell
    $ npm install postcss-nested --save-dev
    ```
1. Create a _postcss.config.js_ file and `require` your plugin
    ```js
    module.exports = {
      plugins: [
        require('postcss-nested')
      ]
    };
    ```
1. Now you can write nested CSS!
    ```css
    :host {
      & .card {
        padding: 2.5rem;
        position: relative;
        display: flex;
        flex-direction: column;
        min-width: 0;
        word-wrap: break-word;
        background-color: #fff;
        background-clip: initial;
        text-align: center;

        & .body {
          padding:10px;
        }

        @media(max-width:768px) {
          padding:0;
        }
      }
    }
    ```

> _For reference, [this is the default postcss.config.js](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/src/config/postcss.config.js) being provided by Greenwood._

<!--
> Note: [.browserslistrc](#browserslist) is used by postcss and is also needed to be overwritten. You can override that in that same directory or you may also configure postcss-preset-env to use default `.browserslistrc` path via environement variable to: `./node_modules/@greenwood/cli/src/config/.browserslistrc`.  See [postcss-preset-env docs](https://www.npmjs.com/package/postcss-preset-env#browsers) for further information. [Ejecting configuration](#eject-configuration) is one way in which you can easily override both with no extra configuraiton.
-->

<!-- 
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
-->