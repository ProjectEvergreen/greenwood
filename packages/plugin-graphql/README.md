# @greenwood/plugin-graphl

## Overview
A plugin for Greenwood to support using [GraphQL](https://graphql.org/) to query your content graph.  It runs [**apollo-server**](https://www.apollographql.com/docs/apollo-server/) on the backend and provides an [**@apollo/client** like](https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.readQuery) interface for the frontend.

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm -i @greenwood/plugin-graphql --save-dev

# yarn
yarn add @greenwood/plugin-graphql --dev
```

## Usage
Add this plugin to your _greenwood.config.js_ and spread the `export`.

```javascript
const pluginGraphQL = require('@greenwood/plugin-graphql');

module.exports = {
  ...

  plugins: [
    ...pluginGraphQL() // notice the spread ... !
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

> _For more information on using GraphQL with Greenwood, [please review our docs](https://www.greenwoodjs.io/docs/data)._