# Greenwood

## Overview
A modern and performant static site generator supporting Web Component based development.

> ⛔ WARNING: This project is not ready for use yet! 🛠️

## Getting Started
By default, Greenwood will generate a site for you in _public/_.
```shell
$ greenwood
```

Fun!  But naturally you'll want to make your own pages.  So create a folder called _src/pages/_ and create a page called _index.md_.
```shell
---
label: 'hello'
---

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

> TODO: make app-template provided by default https://github.com/ProjectEvergreen/greenwood/issues/32
> Customize

### Creating A Page
Here's a an example of a page 
```md
---
label: 'hello'
template: 'page'
---

### Hello World

This is an example page built by Greenwood.  Make your own in _src/pages_!
```

And a page template
```javascript
import { html, LitElement } from 'lit-element';

class index extends LitElement {
  render() {
    return html`
      <h1>Greenwood</h1>
      <div>
        This is the home page built by Greenwood. Make your own pages in <i>src/pages/index.js</i>!
      </div>
    `;
  }
}

customElements.define('home-page', index);
```

## Advanced Markdown

You can also render custom html such as a custom style or even a component within your markdown page using `imports` in your front-matter variables at top, as well as utilizing the `render` code block e.g.

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

### Global CSS / Assets
> TODO 
> https://github.com/ProjectEvergreen/greenwood/issues/7
> https://github.com/ProjectEvergreen/greenwood/issues/27

### Templates
> TODO
> https://github.com/ProjectEvergreen/greenwood/issues/32

By default, Greenwood will supply its own [app-template](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js) and [page-template](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/page-template.js).  You can override these files by creating a src/templates directory in your application along with both template files. 

### App Template
An `app-template.js` must follow the [default template](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js#L1-L13) in that it must include the lit-redux-router, redux, redux-thunk, lazy-reducer-enhancer and it must create a redux store.  You may import any additional components or tools you wish but the `import './list';` [must be included](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js#L16) in order to import all your generated static page components. Do not change the path and you can ignore the fact that this file doesn't exist, it will be created on build in memory.  In the [render function](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js#L21-L26), it must include somewhere:

```html
<lit-route path="/" component="home-page"></lit-route>
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