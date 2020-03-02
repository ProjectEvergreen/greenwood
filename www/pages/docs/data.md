## Data Sources
Having to repeat things when programming is no fun, and that's why (web) component based development is so useful!  As websites start to grow, there comes a point where being able to have access to the content and structure of your site's layout and configuration as part of the development process becomes essential towards maintainability, performance, and scalability.

As an example, if you are developing a blog site, like in our [Getting Started](/getting-started/) guide, having to list a couple blogs posts by hand isn't so bad.

```render html
<ul>
  <li><a href="/blog/2019/first-post.md">First Post</li></a>
  <li><a href="/blog/2019/second-post.md">Second Post</li></a>
</ul>
```

But what happens over time, when that list grows to 10, 50, 100+ posts?  Imagine maintaining that list each time, over and over again?  Not only that, but wouldn't it be great to also be able to sort, search, filter, and organize those posts to make them easier for users to navigate and find?  Even better would be not having to maintain a secondary list of your own content.

Instead, Greenwood uses GraphQL + Apollo to make that a reality!  So instead of a static list, you can do something like this!

```render javascript
render() {
  return html\`
    <ul>
      ${pages.map((page) => {
        return html\`
          <li><a href=\"${page.path}\">${page.title}</a></li>
        \`;
      })}
    </ul>
  \`;
}
```

### Internal Sources
Greenwood exposes a [GraphQL](https://graphql.org/) + [Apollo](https://www.apollographql.com/docs/apollo-server/) server locally when developing available at `localhost:4000` that can be used to get information about your local content like path, "slug", title and other useful information that will be dynamic to the content you have.  Programmatic access to this data can provide the oppourtunity to share your content with your users in a way that supports sorting, filter, organizing, and more!

![graphql-playground](/assets/graphql-playground.png)

#### Schema
To kick things off, let's review what is availalble to you.  Currently, the main "API" is just a list of all pages in your _pages/_ directory, represented as a `Page` [type defintion](https://graphql.org/graphql-js/basic-types/).   This is called Greenwood's `graph`.

This is what the schema looks like:
```render javascript
graph {
  id, // (string) the unique ID given to the generated component as it's selector e.g. \`<wc-md-id></wc-md-id>\`

  link,  // (string) A URL link, typically derived from the filesystem path, e.g. /blog/2019/first-post/ 
  
  title,  // (string) Useful for a page's <title> tag or the title attribute for an <a> tag, inferred from the filesystem path, e.g. "First Post"
  
  filePath, // (string) path to file

  fileName, // (string) file name without extension/path, so that it can be copied to scratch dir with same name

  template // (string) page template used for the page 
}
```

> All queries return subsets and / or derivitives of the `graph`.

#### Queries
To help facilitiate development, Greenwood provides a couple queries out of the box that you can use to get access to the `graph` and to start using them in your components. (which we'll get to next)

Below are the queries available:

> Note: the default return order for pages will be exactly as you have it in your local filesystem.

##### Graph
The Graph query returns an array of all pages.

###### Defintion
```render javascript
query {
  graph {
    id,
    title,
    link,
    filePath,
    fileName,
    template
  }
}
```

###### Usage
`import` the query in your component
```render javascript
import client from '@greenwood/cli/data/client';
import GraphQuery from '@greenwood/cli/data/queries/graph';

.
.
.

async connectedCallback() {
  super.connectedCallback();
  const response = await client.query({
    query: GraphQuery
  });

  this.posts = response.data.graph;
}
```

###### Response
This will return the full `graph` of all pages as an array
```render javascript
[
  {
    id: "dd1ec2ef00cc386",
    title: "Blog",
    link: "/blog/2019/first-post",
    filePath: "./blog/2019/first-post.md",
    fileName: "first-post",
    template: "blog"
  },
  {
    id: "9d2b98c69ab0867"
    title: "Blog",
    link: "/blog/2019/second-post",
    filePath: "./blog/2019/second-post.md",
    fileName: "second-post",
    template: "blog"
  }
]
```

##### Navigation
The Navigation query returns an array of Page "like" objects, representing the top most root pages of your project.

###### Defintion
```render javascript
query {
  navigation {
    label,
    link
  }
}
```

###### Usage
`import` the query in your component
```render javascript
import client from '@greenwood/cli/data/client';
import NavigationQuery from '@greenwood/cli/data/queries/navigation';

.
.
.

async connectedCallback() {
  super.connectedCallback();

  const response = await client.query({
    query: NavigationQuery
  });

  this.navigation = response.data.navigation;
}
```


###### Response
This will return the full `graph` of all top level routes as a Page array
```render javascript
[
  {
    label: "Blog",
    link: "/blog/"
  }
]
```

##### Children
The Children query returns an array of all pages below a given top level route.

###### Defintion
```render javascript
query {
  children {
    id,
    title,
    link,
    filePath,
    fileName,
    template
  }
}
```

###### Usage
`import` the query in your component
```render javascript
import client from '@greenwood/cli/data/client';
import ChildrenQuery from '@greenwood/cli/data/queries/children';

.
.
.

async connectedCallback() {
  super.connectedCallback();
  const response = await client.query({
    query: ChildrenQuery,
    variables: {
      parent: 'blog'
    }
  });

  this.posts = response.data.children;
}
```

###### Response
This will return the full `graph` of all pages as an array that are under a given root, e.g. _/blog_.
```render javascript
[
  {
    id: "dd1ec2ef00cc386",
    title: "Blog",
    link: "/blog/2019/first-post",
    filePath: "./blog/2019/first-post.md",
    fileName: "first-post",
    template: "blog"
  },
  {
    id: "9d2b98c69ab0867"
    title: "Blog",
    link: "/blog/2019/second-post",
    filePath: "./blog/2019/first-post.md",
    fileName: "second-post",
    template: "blog"
  }
]
```

##### Custom
You can of course come up with your own as needed!  Greenwood provides the [`gql-tag`](https://github.com/apollographql/graphql-tag) module and will also resolve _.gql_ or _.graphql_ file extensions!

###### example:
```render javascript
/* src/data/my-query.gql */
query {
  graph {
    /* whatever you are looking for */
  }
}
```

Or within your component
```render javascript
import gql from 'graphql-tag';  // comes with Greenwood

const query = gql\`
  {
    user(id: 5) {
      firstName
      lastName
    }
  }
\`
```

Then you can use `import` anywhere in your components!

##### Complete Example
Now of course comes the fun part, actually seeing it all come together.  Here is an example from the Greenwood website's own [header component](https://github.com/ProjectEvergreen/greenwood/blob/master/www/components/header/header.js).

```render javascript
import { LitElement, html } from 'lit-element';
import client from '@greenwood/cli/data/client';
import NavigationQuery from '@greenwood/cli/data/queries/navigation';

class HeaderComponent extends LitElement {
  
  static get properties() {
    return {
      navigation: {
        type: Array
      }
    };
  }

  constructor() {
    super();
    this.navigation = [];
  }

  async connectedCallback() {
    super.connectedCallback();

    const response = await client.query({
      query: NavigationQuery
    });

    this.navigation = response.data.navigation;
  }

  render() {
    const { navigation } = this;

    return html\`
      <header class="header">

        <nav>
          <ul>
            ${navigation.map((item) => {
              return html\`
                <li>
                  <a href=\"${item.link}\" title=\"Click to visit the ${item.label} page\">${item.label}</a>
                </li>
              \`;
            })}
          </ul>
        </nav>
        
      </header>
    \`;
  }
}

customElements.define('app-header', HeaderComponent);
```

#### External Sources
Coming [soon](https://github.com/ProjectEvergreen/greenwood/issues/21)!