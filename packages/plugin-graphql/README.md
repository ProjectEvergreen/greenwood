# @greenwood/plugin-graphl

## Overview
A plugin for Greenwood to support using [GraphQL](https://graphql.org/) to query your content graph.  It runs [**apollo-server**](https://www.apollographql.com/docs/apollo-server/) on the backend and provides an [**@apollo/client** like](https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.readQuery) interface for the frontend.

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm install @greenwood/plugin-graphql --save-dev

# yarn
yarn add @greenwood/plugin-graphql --dev
```

## Usage
Add this plugin to your _greenwood.config.js_ and spread the `export`.

```javascript
import { greenwoodPluginGraphQL } from '@greenwood/plugin-graphql';

export default {
  ...

  plugins: [
    ...greenwoodPluginGraphQL() // notice the spread ... !
  ]
}
```

## Example
This will then allow you to use GraphQL to query your content.

```js
import client from '@greenwood/plugin-graphql/core/client';
import MenuQuery from '@greenwood/plugin-graphql/queries/menu';

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
    }).join();
    
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

```js
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
import client from '@greenwood/plugin-graphql/core/client';
import GalleryQuery from '/data/queries/gallery.gql';

client.query({
  query: GalleryQuery,
  variables: {
    name: 'logos'
  }
}).then((response) => {
  const logos = response.data.gallery[0].images[i];

  logos.forEach((logo) => {
    console.log(logo.path); // /assets/logo1.png, /assets/logo2.png, /assets/logo3.png
  })
});
```