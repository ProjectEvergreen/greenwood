## Front Matter

Front matter is a YAML block at the top of any markdown file.  It gives you the ability to define variables that are accessible from the markdown file. You can also use it to import additional files.

Example:


```render md
---
title: 'Hello World'
---

# Hello World

```

### Define Rendered Markdown Page Component

When this markdown file is compiled to a component it will automatically generate a component definition. If you want to use a pre-determined component name, you can give the component a label using the predefined variable `label`.

```render md
---
label: 'mypage'
---

```

Which will compile to the element: `<wc-md-mypage></wc-md-mypage>`

### Define Template

If you want to define a custom page template that this markdown file will be rendered in, use the predefined variable `template`

```render md
---
template: 'home'
---

```

In this example, the `src/templates/home-template.js` will be used to render the current markdown page. The `-template.js` part of the file name is unnecessary for this definition, but necessary when you create new templates.

By default, greenwood will look for a `templates/page-template.js` in your workspace directory for all undefined template pages.


### Import files

If you want to import custom files such as custom components you can use the predefiend variable `imports` in the following way:

```render md
---
imports:
  MyFile: '../components/MyFile/myfile.js'
---

```

See [Markdown Docs](/docs/markdown#components) for information about rendering custom components.