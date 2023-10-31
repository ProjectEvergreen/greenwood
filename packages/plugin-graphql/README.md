# @greenwood/plugin-graphql

## Overview
A plugin for Greenwood to support using [GraphQL](https://graphql.org/) to query Greenwood's [content graph](https://www.greenwoodjs.io/docs/data/) with our optional [pre-made queries](https://www.greenwoodjs.io/docs/menus/).  It runs [**apollo-server**](https://www.apollographql.com/docs/apollo-server/) on the backend at build time and provides a **"read-only"** [**@apollo/client** _"like"_](https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.readQuery) interface for the frontend that you can use.

> This package assumes you already have `@greenwood/cli` installed.

## Caveats

As of now, this plugin requires some form of [prerendering](https://www.greenwoodjs.io/docs/server-rendering/#render-vs-prerender) either through:
1. Enabling [custom imports](https://www.greenwoodjs.io/docs/server-rendering/#custom-imports)
1. Installing the [Puppeteer renderer plugin](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-renderer-puppeteer).


## Installation
You can use your favorite JavaScript package manager to install this package.

```bash
# npm
npm install @greenwood/plugin-graphql --save-dev

# yarn
yarn add @greenwood/plugin-graphql --dev
```

## Usage
Add this plugin to your _greenwood.config.js_ and configure with either `prerender: true` _or_ by adding the `greenwoodPluginRendererPuppeteer` plugin.

```javascript
import { greenwoodPluginGraphQL } from '@greenwood/plugin-graphql';
import { greenwoodPluginRendererPuppeteer } from '@greenwood/plugin-renderer-puppeteer'; // if using puppeteer

export default {
  // ...
  prerender: true, // if using custom imports
  plugins: [
    greenwoodPluginGraphQL(),
    greenwoodPluginRendererPuppeteer()
  ]
}
```

## Example
This will then allow you to use GraphQL to query your content from your client side.  At build time, it will generate JSON files so that the data is still accessible statically.

```js
import client from '@greenwood/plugin-graphql/src/core/client.js';
import MenuQuery from '@greenwood/plugin-graphql/src/queries/menu.gql';

class HeaderComponent extends HTMLElement {
  constructor() {
    super();

    this.root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const response = await client.query({
      query: MenuQuery,
      variables: {
        name: 'navigation',
        order: 'index_asc'
      }
    });

    this.navigation = response.data.menu.children.map(item => item.item);
    this.root.innerHTML = this.getTemplate(navigation);
  }

  getTemplate(navigation) {
    const navigationList = navigation.map((menuItem) => {
      return `
        <li>
          <a href="${menuItem.route}" title="Click to visit the ${menuItem.label} page">${menuItem.label}</a>
        </li>
      `;
    }).join('');

    return `
      <header>
        <nav>
          <ul>
            ${navigationList}
          </ul>
        </nav>
      <header>
    `;
  }
}

customElements.define('app-header', HeaderComponent);
```

> _For more general purpose information on integrating GraphQL with Greenwood, [please review our docs](https://www.greenwoodjs.io/docs/data)._

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

```graphql
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
import GalleryQuery from '../relative/path/to/data/queries/gallery.gql';

client.query({
  query: GalleryQuery,
  variables: {
    name: 'logos'
  }
}).then((response) => {
  const logos = response.data.gallery[0].images[i];

  logos.forEach((logo) => {
    console.log(logo.path); // /assets/logo1.png, /assets/logo2.png, /assets/logo3.png
  });
});
```