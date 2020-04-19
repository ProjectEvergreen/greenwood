---
label: 'menus'
menu: side
title: 'Menus'
index: 5
linkheadings: 3
---

## Menus
In this section we'll touch on the menu related feature of Greenwood which utilizes [data sources](/docs/data) within a component to query for [front matter](/docs/front-matter) declared menus.

### Declare Menu

A common example of a menu you might use would be a **navigation** menu.

To do this we first need to define which pages will be linked in this navigation menu.

For this example, let's say we want "about", "docs", "contact us", all linked within our navigation menu. Then we need to define the navigation menu, within the [front matter](/docs/front-matter) at the top of each page.  The front matter defined variables for menus are:

| Variable    |  Description                                      |
|-------------|:--------------------------------------------------|
| title       |  The title/label of the page link within the menu |
| menu        |  The name of the menu, cannot have spaces or special characters.                             |
| index       | The position of the page within a menu. Custom set the position higher or lower than default. You can sort these positions alphabetically or by index   |
| linkheadings | Integer. If you want to parse the page for headings and include them as children of the page link, add `linkheadings: 3` to parse for `<h3>` headings. Set integer to the heading level you want to parse. e.g. `h1, h2, h3` |

e.g. create the following in a new directory within your `/pages` directory.

`index.md`

```render md
---
title: 'About'
menu: 'navigation'
index: 1
---

# About
```


`docs.md`

```render md
---
title: 'Docs'
menu: 'navigation'
index: 2
---

# Documentation
```

`contact.md`

```render md
---
title: 'Contact'
menu: 'navigation'
index: 3
linkheadings: 3
---

# Contact

### Online

### Offline

### Locations
```

> **Note:** the front-matter variable `linkheadings: 3` will add all the `<h3>` headings as children subitems within a menu item.  So in this example the menu item `Contact`, will have the children: `Online`(linked to #online), `Offline`(linked to #offline), and `Locations`(linked to #locations).  You can set `linkheadings:` to any header level you require not just `3` e.g. `linkheadings: 2` for `<h2>` elements.

### Retrieve Menu

Now in order to use our navigation menu within a component we need to query it via GraphQL, see [data sources](/docs/data) for more information.

`navigation.js`

```render js
import { LitElement, html } from 'lit-element';
import client from '@greenwood/cli/data/client';
import MenuQuery from '@greenwood/cli/data/queries/menu';

class HeaderComponent extends LitElement {

  constructor() {
    super();
    this.navigation = [];
  }

  async connectedCallback() {
    super.connectedCallback();

    const response = await client.query({
      query: MenuQuery,
      variables: {
        name: 'navigation'
      }
    });

    this.navigation = response.data.menu.children;
  }

  render() {
    const { navigation } = this;

    return html\`
      <nav>
        <ul>
          ${navigation.map(({ item }) => {
            return html\`
              <li><a href='\${item.link}' title='Click to visit the \${item.label} page'>\${item.label}</a></li>
            \`;
          })}
        </ul>
      </nav>
    \`;
  }
}
customElements.define('eve-header', HeaderComponent);
```

The query will result in the object(default sort by filename):
```render js
menu: {
  children:[
    {
      children: [
        { item: {label: "Online", link: "#online"}},
        { item: {label: "Offline", link: "#offline"}},
        { item: {label: "Locations", link: "#locations"}},
      ],
      item: {label: "Contact", link: "/mydirectory/contact"}
    },
    {
      children: []
      item: {label: "Docs", link: "/mydirectory/docs"}
    },
    {
      children: []
      item: {label: "About", link: "/mydirectory/"}
    }
  ],
  item: {label: "navigation", link: "na"}
]
```


### Sorting

The position of items within a menu can be sorted by simply adding the `order` variable to our query.

```render js
const response = await client.query({
  query: MenuQuery,
  variables: {
    name: 'navigation',
    order: 'index_asc'
  }
});
```


The following sorts are available.

| Sort      | Description
|-----------|:---------------|
|           | no order declared, sorts by alphabetical file name |
|index_asc  | Sort by index, ascending order |
|index_desc | Sort by index, descending order |
|title_asc  | Sort by title, ascending order |
|title_desc | Sort by title, descending order |

### Filtering By Path

If you only want specific menu items to show within a specific subdirectory. You can also include the `route` variable to specify a specific path the menu will be displaying on.  By doing so, only pages with a menu that matches the base path of the route provided would be included in the query.  This would be useful for a shelf menu, for example if path is `/docs/somepage` and you only want to include pages within the `/docs` directory in your menu. You would set your `route:` variable to `window.location.pathname`.

```render js
const response = await client.query({
  query: MenuQuery,
  variables: {
    name: 'shelf',
    order: 'index_asc',
    route: window.location.pathname
  }
});
```

#### Filter By Path Example.

You have 2 directories: `/docs` and `/about`.

Each directory has two pages and you have one single menu declared within all your pages front-matter called: **shelf**

`/docs/index.md`:
```render md
---
title: 'documentation'
menu: 'shelf'
---

# Documentation
```

`/docs/components.md`:
```render md
---
title: 'components'
menu: 'shelf'
---

# components
```

`/about/index.md`:
```render md
---
title: 'about'
menu: 'shelf'
---

# About
```

`/about/stuff.md`:
```render md
---
title: 'stuff'
menu: 'shelf'
---

# Stuff
```

#### Query the example

Now when you query by **route** for the **shelf** menu, you will only see menu items associated with the base path of either `/docs` (if you're viewing /docs) or `/about`(if you're viewing /about).


```render js
const response = await client.query({
  query: MenuQuery,
  variables: {
    name: 'shelf',
    order: 'index_asc',
    route: window.location.pathname
  }
});
```

Despite having the same menu declared in all 4 pages, by including `route:` variable we're filtering our menus based on the basePath(subdirectory).

The object result for `/docs` is:

```render js
"menu":{
  "item": {"label": "shelf", "link": "na"},
  "children":[{
      "item":{"label":"Components","link":"/docs/components"},
      "children":[]
    },
    {
      "item":{"label":"Docs","link":"/docs/""},
      "children":[]
    }
  ]
}
```

The object result for `/about` is:

```render js
"menu":{
  "item": {"label": "shelf", "link": "na""},
  "children":[{
      "item":{"label":"stuff","link":"/about/stuff"},
      "children":[]
    },
    {
      "item":{"label":"about","link":"/about/"},
      "children":[]
    }
  ]
}
```

