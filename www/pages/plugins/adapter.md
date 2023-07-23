---
label: 'adapter'
menu: side
title: 'Adapter'
index: 1
---

## Adapter

Adapter plugins are designed with the intent to be able to post-process the Greenwood standard build output.  For example, moving output files around into the desired location for a specific hosting provider, like Vercel or AWS.

> _In particular, plugins built around this API are intended to help Greenwood users ship to serverless and edge runtime environments._

## API

An adapter plugin is simply an `async` function that gets invoked by the Greenwood CLI after all assets, API routes, and SSR pages have been built and optimized.  With access to the compilation, you can also process all these files to meet any additional format / output targets.

<!-- eslint-disable no-unused-vars -->
```js
const greenwoodPluginMyPlatformAdapter = (options = {}) => {
  return {
    type: 'adapter',
    name: 'plugin-adapter-my-platform',
    provider: (compilation) => {
      return async () => {
        // run your code here....
      };
    }
  };
};

export {
  greenwoodPluginMyPlatformAdapter
};
```

## Example

The most common use case is to "shim" in a hosting platform handler function in front of Greenwood's, which is based on two parameters of `Request` / `Response`.  In addition, producing any hosting provided specific metadata is also doable at this stage.

Here is an example of the "generic adapter" created for Greenwood's own internal test suite.

```js
import fs from 'fs/promises';
import { checkResourceExists } from '../../../../cli/src/lib/resource-utils.js';

function generateOutputFormat(id, type) {
  const path = type === 'page'
    ? `__${id}`
    : `api/${id}`;

  return `
    import { handler as ${id} } from './${path}.js';

    export async function handler (request) {
      const { url, headers } = request;
      const req = new Request(new URL(url, \`http://\${headers.host}\`), {
        headers: new Headers(headers)
      });
      return await ${id}(req);
    }
  `;
}

async function genericAdapter(compilation) {
  const { outputDir, projectDirectory } = compilation.context;
  // custom output directory, like for .vercel or .netlify
  const adapterOutputUrl = new URL('./adapter-output/', projectDirectory);
  const ssrPages = compilation.graph.filter(page => page.isSSR);

  if (!await checkResourceExists(adapterOutputUrl)) {
    await fs.mkdir(adapterOutputUrl);
  }

  for (const page of ssrPages) {
    const { id } = page;
    const outputFormat = generateOutputFormat(id, 'page');

    // generate a shim for all SSR pages
    await fs.writeFile(new URL(`./${id}.js`, adapterOutputUrl), outputFormat);

    // copy all entry points
    await fs.cp(new URL(`./_${id}.js`, outputDir), new URL(`./_${id}.js`, adapterOutputUrl));
    await fs.cp(new URL(`./__${id}.js`, outputDir), new URL(`./_${id}.js`, adapterOutputUrl));

    // generate a manifest
    await fs.writeFile(new URL('./metadata.json', adapterOutputUrl), JSON.stringify({
      version: '1.0.0',
      runtime: 'nodejs'
      // ...
    }));
  }
}

const greenwoodPluginAdapterGeneric = (options = {}) => [{
  type: 'adapter',
  name: 'plugin-adapter-generic',
  provider: (compilation) => {
    return async () => {
      await genericAdapter(compilation, options);
    };
  }
}];

export { greenwoodPluginAdapterGeneric };
```

> _**Note**: Check out [Vercel adapter plugin](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-adapter-vercel) for a more complete example._