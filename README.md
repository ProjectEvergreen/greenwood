# Greenwood

## Overview
A modern and performant static site generator supporting Web Component based development.

> ⛔ WARNING: This project is not ready for use yet! 🛠️

## Getting Started
By default, Greenwood will generate a site for you in _public/_.
```shell
$ greenwood build
```

Fun!  But naturally you'll want to make your own pages.  So create a folder called _src/pages/_ and create a page called _index.md_.
```md
# Helloworld
```

and run `greenwood` again and you should now see a new page called hello!

You can keep using this make more pages, but eventually you'll want to start creating your page templates, reusable components, and metadata configuration, so let's get to the good stuff!

## Usage
Here are some guides for how to get the most out of Greenwood.

### Project Structure
Your project will generally have a structure like this:
```shell
├── src
│   ├── pages
│   │   ├── index.md
│   │   ├── a.md
│   │   └── b.md
│   └── templates
│       ├── app-template.js
│       └── page-template.js
```

- Pages: The markdown (or JavaScript) you want to use to render the contents of your page.  (examples below)
- Templates: Every markdown page will get run through a page template, that can be defined in the pages frontmatter

> Note: All files in your workspace _must_ reside be in a directory.  e.g. [_src/theme.css_ will **not** work](https://github.com/ProjectEvergreen/greenwood/issues/85).

### Creating A Page

Pages should be placed in your `src/pages/` directory. Page filenames will become the page's generated path. e.g.

Here's a an example of a `src/pages/mypage.md` 
```md
### Hello World

This is an example page built by Greenwood.  Make your own in _src/pages_!
```

Will accessible at http://localhost:8000/mypage

You can nest directories in your `src/pages` directory which will also be used for the final URL.  

e.g. a markdown file at `src/pages/myblog/mycategory/index.md` will be accessible at http://localhost:8000/myblog/mycategory

Another example a markdown file at `src/pages/myblog/mycategory/mypage.md` will be accessible at http://localhost:8000/myblog/mycategory/mypage

You can also create [custom templates](#front-matter-template) to style and layout each page. As well as [customize the overall app template](#app-template)

## Advanced Markdown

You can add front-matter variables to the top, such as label, template, imports, as well as render components and html within each md file.

### Front-Matter Label

By default, a randomly generated export name will be created. `label` front-matter variable is completely optional.

`label` front-matter variable will set the name of the exported md built web component element, within a default page template. 

e.g. example below would output `<eve-hello></eve-hello>` with a child of `<wc-md-hello></wc-md-hello>` element containing the markdown


```md
---
label: 'hello'
---
### Hello World

This is an example page built by Greenwood.  Make your own in src/pages!

```

### Front-Matter Template

You can also have your md file compiled within a custom page template. By default, each md file is automatically placed in a default(included) `page-template.js` component and exported with a generated/set label name.

e.g. example below `<eve-hello></eve-hello>` (all template element labels are prepended with `eve-`).  

You can add custom templates by specifying the `template` front-matter variable.

The `template` variable string value will be appended with `-template.js` and is expected to be the an accessibile filename from within your `src/templates` directory.  

e.g. `template: 'guides'` will use a `src/template/guides-template.js` file. 

[See Page Template section](#page-template) below for an example `page-template.js` file.

```md
---
label: 'hello'
template: 'guides'
---
### Hello World

This is an example page built by Greenwood.  Make your own in src/pages!

```

### Front-Matter Render

You can also render custom html such as a custom style or even a component within your markdown page using `imports` in your front-matter variables, as well as utilizing the `render` code block e.g.

````md
---
label: 'hello'
template: 'page'
imports:
  header: '../components/mycomponent.js'
  CSS: '../styles/mystyle.css'
---

### Hello World

This is an example page built by Greenwood.  Make your own in src/pages!

```render
<style>${CSS}</style>
<my-component></my-component>
```
````

## API
Here are some of the features and capabiliites of Greenwood.

### Configure

Custom greenwood configurations can be added to a `greenwood.config.js` file in your root directory. For example, you may want to change the `src` folder to something else such as `www`. By default, you can use a path relative to the current working directory. You can also use an absolute path.

```js
module.exports = {
    workspace: 'www'
};

```

#### PublicPath

If you're hosting at yourdomain.com/mysite/ as the root to your site, you can change the public path by adding it within a `greenwood.config.js`:

```js
module.exports = {
    publicPath: '/mysite/',
};
```

#### Dev Server

You can adjust your dev server host and port, if you prefer to use something other than the default by adding it with a `greenwood.config.js`. The host url is automatically prepended with `http://` by default.

```js
module.exports = {
    devServer: {
      port: 1984,
      host: 'localhost'
    }
};
```

### Global CSS / Assets
> TODO 
> https://github.com/ProjectEvergreen/greenwood/issues/7
> https://github.com/ProjectEvergreen/greenwood/issues/27

### Templates

By default, Greenwood will supply its own [app-template](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js) and [page-template](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/page-template.js).  You can override these files by creating a src/templates directory in your application along with both template files. 

### App Template
An `app-template.js` must follow the [default template](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js#L1-L13) in that it must include the lit-redux-router, redux, redux-thunk, lazy-reducer-enhancer and it must create a redux store.  You may import any additional components or tools you wish but the `import './list';` [must be included](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js#L16) in order to import all your generated static page components. Do not change the path and you can ignore the fact that this file doesn't exist, it will be created on build in memory.  In the [render function](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js#L21-L26), it must include somewhere:

```html
MYROUTES
```

`MYROUTES` is a placeholder for where all your generated page routes will be automatically placed. It must be present beneath a default root route. You may change the component of this root route but not the path.

### Page Template
All page templates must be placed in the `src/templates` directory. All page templates must be named [somename]-template.js.  The default page template is [page-template.js](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/page-template.js) which you can override simply by including it. To import your markdown files within a given page-template, you must [include the placeholder](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/page-template.js#L3) `MDIMPORT`. To set the position of where the markdown content will be placed within your page template, you must include an `<entry></entry>` placeholder element for the generated markdown component. For example:

```html
<div class='page-template content'>
    <entry></entry>
</div>
```

**Note**: For now, you must include an app-template.js in your templates folder, if you wish to use custom page-templates.