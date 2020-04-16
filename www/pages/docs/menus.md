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

e.g.

`about.md`

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
---

# Contact
```



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
|label_asc  | Sort by label, ascending order |
|label_desc | Sort by label, descending order |

### Filtering By Path

If you only want specific menu items to show within a specific subdirectory. You can also include the `route` variable to specify a specific path the menu will be displaying on.  This would be useful for a shelf menu for example.

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