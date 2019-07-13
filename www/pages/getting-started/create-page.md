## Creating A Page

Pages should be placed in your `src/pages/` directory. Page filenames will become the page's generated path. e.g.

Here's an example of a `src/pages/mypage.md`
```render md
### Hello World

This is an example page built by Greenwood.  Make your own in _src/pages_!
```

Will accessible at http://localhost:8000/mypage

You can nest directories in your `src/pages` directory which will also be used for the final URL.

e.g. a markdown file at `src/pages/myblog/mycategory/index.md` will be accessible at http://localhost:8000/myblog/mycategory

Another example a markdown file at `src/pages/myblog/mycategory/mypage.md` will be accessible at http://localhost:8000/myblog/mycategory/mypage

You can also create [custom templates](#front-matter-template) to style and layout each page. As well as [customize the overall app template](#app-template)

### Front Matter

At the top of each page you can define variables that will be used during compilation for each page. You can use these for custom imports, themes, and class names.

#### Custom Themes

By default, the compiler will search for a `page-template.js` default theme file in `src/templates/page-template.js`. You can also add additional custom themes by simply adding  `template: 'yourtemplatename` to your markdown file's front matter.

For example, the following front matter at the top of a markdown file will use the template `src/templates/home-template.js`

```render md
---
template: 'home'
---
```



#### Custom Imports/components

To import a component, you simply need to add a variable and path to the component from within a markdown file's front-matter at the top of the file.

For example, the following front-matter at the top of a markdown file will use the component `src/components/HelloWorld/hello-world.js`

```render md
---
imports:
  Hello: '../components/HelloWorld/hello-world.js'
---
```

You can then render a custom component using the component element's definition within your markdown page!

`````render md
\`\`\`render
<hello-world></hello-world>
\`\`\`
`````
