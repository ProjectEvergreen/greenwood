---
collection: plugins
order: 3
---

## Copy

The copy plugin allows users to copy files around as part of the [build](/docs/#cli) command.  For example, Greenwood uses this feature to copy all files in the user's _/assets/_ directory to final output directory automatically.  You can use this plugin to copy single files, or entire directories.

## API
This plugin supports providing an array of "paired" URL objects that can either be files or directories, by providing a `from` and `to` location.
```js
export function myCopyPlugin() {
  return {
    type: 'copy',
    name: 'plugin-copy-some-files',
    provider: (compilation) => {
      const { context } = compilation;

      return [{
        // copy a file
        from: new URL('./robots.txt', context.userWorkspace),
        to: new URL('./robots.txt', context.outputDir)
      }, {
        // copy a directory (notice the trailing /)
        from: new URL('./pdfs/', context.userWorkspace),
        to: new URL('./pdfs/', context.outputDir)
      }];
    }
  };
}
```


> _You can see more examples in the [Greenwood repo](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/src/plugins/copy)._