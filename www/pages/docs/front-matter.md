---
menu: docs
title: Front Matter
---

## Front Matter

"Front matter" is a [YAML](https://yaml.org/) block at the top of any markdown file.  It gives you the ability to define variables that are made available to Greenwood's build process. You can also use it to `import` additional files.

#### Example:
```render md
---
title: 'Hello World'
---

# Hello World
The is a markdown file with title defined in front-matter.
```

### Page Configuration

When this markdown file is compiled to a component it will automatically generate a component definition. If you want to use a custom element name for your component, you can give the component a label using the predefined variable `label`.

#### Example
```render md
---
label: 'mypage'
---

```

Which will compile to the element: `<wc-md-mypage></wc-md-mypage>`

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