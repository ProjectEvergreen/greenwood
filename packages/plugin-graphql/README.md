# @greenwood/plugin-graphql

## Overview

A plugin for Greenwood to support using [GraphQL](https://graphql.org/) to query Greenwood's [content graph](https://www.greenwoodjs.dev/docs/content-as-data/) with our optional pre-made queries custom for GraphQL.  It runs [**apollo-server**](https://www.apollographql.com/docs/apollo-server/) on the backend at build time and provides a **"read-only"** [**@apollo/client** _"like"_](https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.readQuery) interface for the frontend that you can use.  For more information and complete docs on Greenwood, please visit [our website](https://www.greenwoodjs.dev).

> This package assumes you already have `@greenwood/cli` installed.

## Caveats

As of now, this plugin requires some form of [prerendering](https://www.greenwoodjs.dev/docs/reference/rendering-strategies/) either through:
1. Enabling [custom imports](https://www.greenwoodjs.dev/docs/pages/server-rendering/#custom-imports), or
1. Installing the [Puppeteer renderer plugin](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-renderer-puppeteer)

It will also require setting [`activeContent`](https://greenwoodjs.dev/docs/reference/configuration/#active-content) to `true`.

## Installation

You can use your favorite JavaScript package manager to install this package.

```bash
# npm
$ npm i -D @greenwood/plugin-graphql

# yarn
$ yarn add @greenwood/plugin-graphql --dev

# pnpm
$ pnpm add -D @greenwood/plugin-graphql
```

## Usage

Add this plugin to your _greenwood.config.js_ and then choose your flavor.  For example, this is the configuration for using Puppeteer.

```js
import { greenwoodPluginGraphQL } from '@greenwood/plugin-graphql';
import { greenwoodPluginRendererPuppeteer } from '@greenwood/plugin-renderer-puppeteer';

export default {
  activeContent: true,
  prerender: true,
  plugins: [
    greenwoodPluginGraphQL(),
    greenwoodPluginRendererPuppeteer()
  ]
}
```

## Types

Types should automatically be inferred through this package's exports map, but can be referenced explicitly in both JavaScript (JSDoc) and TypeScript files if needed.

```js
/** @type {import('@greenwood/plugin-graphql').GraphQLPlugin} */
```

```ts
import type { GraphQLPlugin } from '@greenwood/plugin-graphql';
```

## Example

This will then allow you to use GraphQL to query your content from your client side.  At build time, it will generate JSON files so that the data is still accessible through hydration techniques.

```js
import client from '@greenwood/plugin-graphql/src/core/client.js';
import CollectionQuery from '@greenwood/plugin-graphql/src/queries/collection.gql';

const template = document.createElement('template');

class HeaderComponent extends HTMLElement {
  async connectedCallback() {
    super.connectedCallback();

    if (!this.shadowRoot) {
      const response = await client.query({
        query: CollectionQuery,
        variables: {
          name: 'nav'
        }
      });
      const navigation = response.data.collection;
      
      template.innerHTML = `
        <nav>
          <ul>
            ${navigation.map((item) => {
              const { route, label } = item;

              return `
                <li>
                  <a href="${route}" title="Click to visit the ${label} page">${label}</a>
                </li>
              `;
            })}
          </ul>
        </nav>
      `;

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

customElements.define('app-header', HeaderComponent);
```

## Schema

The basic page schema follow the structure of the [page data](https://greenwoodjs.dev/docs/content-as-data/pages-data/) structure.   Currently, the main "API" is just a list of all pages in your _pages/_ directory, represented as a `Page` [type definition](https://graphql.org/graphql-js/basic-types/).   This is called Greenwood's [**graph**](https://greenwoodjs.dev/docs/reference/appendix/#graph).

This is what the schema looks like:
```gql
graph {
  id,
  label,
  title,
  route,
  layout
}
```

> All queries return subsets and / or derivatives of the `graph`.


## Queries

Greenwood provides a couple of queries out of the box that you can use to get access to the `graph` and start using it in your components, which we'll get to next.

### Graph

The Graph query returns an array of all pages.

```js
import client from '@greenwood/plugin-graphql/src/core/client.js';
import GraphQuery from '@greenwood/plugin-graphql/src/queries/graph.gql';

class SomeComponent extends HTMLElement {
  async connectedCallback() {
    super.connectedCallback();
    const response = await client.query({
      query: GraphQuery
    });

    this.posts = response.data.graph;
  }
}

customElements.define('x-component', SomeComponent);
```

### Collections

Based on [our Collections feature](http://www.greenwoodjs.dev/docs/content-as-data/collections/) for querying based on collections.

```js
import client from '@greenwood/plugin-graphql/src/core/client.js';
import CollectionQuery from '@greenwood/plugin-graphql/src/queries/collection.gql';

class SomeComponent extends HTMLElement {
  async connectedCallback() {
    super.connectedCallback();
    const response = await client.query({
      query: CollectionQuery,
      variables: {
        name: 'nav'
      }
    });

    this.items = response.data.collection;
  }
}

customElements.define('x-component', SomeComponent);
```

### Children 

This will return a set of pages under a specific route and is akin to using [`getContentByRoute`](http://www.greenwoodjs.dev/docs/content-as-data/data-client/#content-by-route).

```js
import client from '@greenwood/plugin-graphql/src/core/client.js';
import ChildrenQuery from '@greenwood/plugin-graphql/src/queries/children.gql';

class SomeComponent extends HTMLElement {
  async connectedCallback() {
    super.connectedCallback();
    const response = await client.query({
      query: ChildrenQuery,
      variables: {
        parent: '/blog'
      }
    });

    this.posts = response.data.children;
  }
}

customElements.define('x-component', SomeComponent);
```

### Custom

You can of course come up with your own as needed!  Greenwood provides the [`gql-tag`](https://github.com/apollographql/graphql-tag) module and will also resolve _.gql_ or _.graphql_ file extensions!

```gql
/* src/data/my-query.gql */
query {
  graph {
    /* whatever you are looking for */
  }
}
```

Or within your component:

```js
import gql from 'graphql-tag';  // comes with Greenwood

const query = gql`
  {
    user(id: 5) {
      firstName
      lastName
    }
  }
`

console.log({ query })
```

### Sorting

The position of items within a query can be sorted by simply adding the `order` variable to our query.

```js
import client from '@greenwood/plugin-graphql/src/core/client.js';
import CollectionQuery from '@greenwood/plugin-graphql/src/queries/collection.gql';

const response = await client.query({
  query: CollectionQuery,
  variables: {
    name: 'navigation',
    order: 'order_asc'
  }
});

console.log({ response });
```

The following sorts are available.

| Sort      | Description
|-----------|:---------------|
|           | no order declared, sorts by alphabetical file name |
|order_asc  | Sort by index, ascending order |
|order_desc | Sort by index, descending order |
|title_asc  | Sort by title, ascending order |
|title_desc | Sort by title, descending order |

### Filtering

If you only want specific items to show within a specific subdirectory. You can also include the `parent` variable to narrow down a set of pages in a `ChildrenQuery`.  This would be useful for a sub navigation menu, for example if you only want pages under `/blog/`, you can set the `parent` variable accordingly.

```js
import client from '@greenwood/plugin-graphql/src/core/client.js';
import ChildrenQuery from '@greenwood/plugin-graphql/src/queries/children.gql';

const response = await client.query({
  query: ChildrenQuery,
  variables: {
    name: 'shelf',
    order: 'order_asc',
    parent: '/blog/'
  }
});

console.log({ response });
```

## Custom Schemas

This plugin also supports you providing your own custom schemas in your project so you can make GraphQL pull in whatever data or content you need!

Just create a _data/schema_ directory and then Greenwood will look for any files inside it that you can use to export typeDefs and resolvers.  Each schema file must specifically export a `customTypeDefs` and `customResolvers`.

### Example

For example, you could create a "gallery" schema that could be used to group and organize photos for your frontend using variable.
```js
import gql from 'graphql-tag';

const getGallery = async (root, query) => {
  if (query.name === 'logos') {
    // you could of course use fs here and look up files on the filesystem, or remotely!
    return [{
      name: 'logos',
      title: 'Home Page Logos',
      images: [{
        path: '/assets/logo1.png'
      }, {
        path: '/assets/logo2.png'
      }, {
        path: '/assets/logo3.png'
      }]
    }];
  }
};

const galleryTypeDefs = gql`
  type Image {
    path: String
  }

  type Gallery {
    name: String,
    title: String,
    images: [Image]
  }

  extend type Query {
    gallery(name: String!): [Gallery]
  }
`;

const galleryResolvers = {
  Query: {
    gallery: getGallery
  }
};

// naming is up to you as long as the final export is correct
export {
  galleryTypeDefs as customTypeDefs,
  galleryResolvers as customResolvers
};
```

```gql
// gallery.gql
query($name: String!) {
  gallery(name: $name)  {
    name,
    title,
    images {
      path
    }
  }
}
```

And then you can use it in your code as such:
```js
import client from '@greenwood/plugin-graphql/src/core/client.js';
import GalleryQuery from '../relative/path/to/data/queries/gallery.gql' with { type: 'gql' };

client.query({
  query: GalleryQuery,
  variables: {
    name: 'logos'
  }
}).then((response) => {
  const logos = response.data.gallery[0].images;

  logos.forEach((logo) => {
    console.log(logo.path); // /assets/logo1.png, /assets/logo2.png, /assets/logo3.png
  });
});
```