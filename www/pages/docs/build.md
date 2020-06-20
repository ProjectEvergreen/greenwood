---
label: 'build'
menu: side
title: 'Build'
index: 4
linkheadings: 3
---

# Build Configurations

A number of core build configuration files can be overridden by creating each file within the root path of your project. You can also automate this task in a single command [see eject configurations](#eject-configurations).

### Eject Configurations

From greenwood CLI you can eject core configuration files(webpack, postcss, babel, browserslistrc) into your project's working directory which will make it easier to add your own customizations.  To do so, add the following to your package.json `scripts` object:

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
$ yarn eject
```

To run the eject task which copies all the configuration files into your project's working directory.
