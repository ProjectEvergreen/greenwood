---
menu: side
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

## Build Output

To provide a starting point, let's look at how Greenwood builds and outputs SSR pages and API routes.  Given this project structure
```shell
src/
  api/
    greeting.js
    nested/
      endpoint.js
  pages/
    blog/
      first-post.js
      index.js
    index.js
```

The output would look like this, with additional chunks being generated as needed based on the input files.
```
public/
  api/
    greeting.js
    nested-endpoint.js
  blog-first-post.route.js
  blog-first-post.chunk.[hash].js
  blog-index.route.js
  blog-index.route.chunk.[hash].js
  index.route.js
  index.route.chunk.[hash].js
```

## Example

The most common use case is to "shim" in a hosting platform handler function in front of Greenwood's, which is based on two parameters of `Request` / `Response`.  In addition, producing any hosting provided specific metadata is also doable at this stage.

Here is an example of the "generic adapter" created for Greenwood's own internal test suite.

```js
import fs from 'fs/promises';
import { checkResourceExists } from '../../../../cli/src/lib/resource-utils.js';

function generateOutputFormat(id, type) {
  const path = type === 'page' ? `/${id}.route` : id;
  const ref = id.replace(/-/g, '').replace(/\//g, '');

  return `
    import { handler as ${ref} } from '../public${path}.js';

    export async function handler (request) {
      const { url, headers } = request;
      const req = new Request(new URL(url, \`http://\${headers.host}\`), {
        headers: new Headers(headers)
      });

      return await ${ref}(req);
    }
  `;
}

async function genericAdapter(compilation) {
  const adapterOutputUrl = new URL('./adapter-output/', compilation.context.projectDirectory);
  const ssrPages = compilation.graph.filter(page => page.isSSR);
  const apiRoutes = compilation.manifest.apis;

  if (!await checkResourceExists(adapterOutputUrl)) {
    await fs.mkdir(adapterOutputUrl);
  }

  for (const page of ssrPages) {
    const { outputPath } = page;
    const id = outputPath.replace('.route.js', '');
    const outputFormat = generateOutputFormat(id, 'page');

    await fs.writeFile(new URL(`./${id}.js`, adapterOutputUrl), outputFormat);
  }

  for (const [key] of apiRoutes) {
    const { outputPath } = apiRoutes.get(key);
    const outputFormat = generateOutputFormat(outputPath.replace('.js', ''), 'api');

    await fs.writeFile(new URL(`.${outputPath.replace('/api/', '/api-')}`, adapterOutputUrl), outputFormat);
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