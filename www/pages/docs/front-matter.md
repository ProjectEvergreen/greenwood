---
label: 'front-matter'
menu: side
title: 'Front Matter'
index: 3
linkheadings: true
---

## Front Matter

"Front matter" is a [YAML](https://yaml.org/) block at the top of any markdown file.  It gives you the ability to define variables that are made available to Greenwood's build process. You can also use it to `import` additional files.

### Element Label

When this markdown file is compiled to a component it will automatically generate a custom element tag name. If you want to use a custom element name of your own for your page, you can give the component a label using the predefined variable `label`.

#### Example
```render md
---
label: 'mypage'
---

```

Which will compile to the element: `<wc-md-mypage></wc-md-mypage>`


### Imports

If you want to import custom files such as a custom element, you can use the predefined variable `imports`.

#### Example
```render md
---
imports:
  MyFile: '../components/MyFile/myfile.js'
---

```

See our [Markdown Docs](/docs/markdown#imports) for more information about rendering custom elements in markdown files.


### Template
When creating multiple page templates, you can use the `template` front-matter to configure Greenwood to use that template for a given page.

#### Example
```render md
---
template: 'home'
---

# Home Page
This is the home page
```

In this example, the _src/templates/home-template.js_ will be used to render the current markdown page.

> **Note:** By default, Greenwood will use `src/templates/page-template.js` for all undefined template pages.


### Title
To set the `<title>` for a given page, you can set the `title` variable.  Otherwise, the `<title>` will be inferred from the file name.

#### Example
```render md
---
title: 'My Blog Post'
---

# This is a post
The is a markdown file with title defined in front-matter.
```

In this example, the `<title>` tag will be the `title`.
```render html
<title>My Blog Post</title>
```

> Note: If you set `title` from your [configuration file](/docs/configuration#title), the output would be 
> ```render html
> <title>{ConfigTitle} - My Blog Post</title>
> ```

### Custom Data 

You can also pass custom data from your markdown file and extract that through the GraphQL server.


#### Example
```render md
---
author: 'Jon Doe'
date: '04/07/2020'
---
```

You would then need to create a `graph` GraphQL query and use that with Greenwood's built in client to get access to that `data`, plus whatever other fields you might want.
```render gql
query {
  graph {
    data: {
      author,
      date
    }
  }
}
```

> See [our docs](https://deploy-preview-284--elastic-blackwell-3aef44.netlify.com/docs/data#internal-sources) on using GraphQL w/Greenwood for more information on querying for data.