# Greenwood

## Overview
A modern and performant static site generator supporting Web Component based development.

> ⛔ WARNING: This project is not ready for use yet! 🛠️

## Usage
By default, Greenwood will generate a site for you in _public/_.
```shell
$ greenwood
```

Fun!  But naturally you'll want to make your own pages.  So create a folder called _src/pages/_ and create a page called _index.md_.
```shell
---
path: '/hello'
label: 'hello'
---
```

## Project Setup

Your project should be setup in the following structure
```
├── src
│   ├── components
│   │   └── index.js
│   ├── pages
│   │   └── hello.md
│   └── templates
│       ├── app-template.js
│       └── page-template.js
```

## Templates

By default, Greenwood will supply its own [app-template](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js) and [page-template](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/page-template.js).  You can override these files by creating a src/templates directory in your application along with both template files. 

### App Template

An app-template.js must follow the [default template](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js#L1-L13) in that it must include the lit-redux-router, redux, redux-thunk, lazy-reducer-enhancer and it must create a redux store.  You may import any additional components or tools you wish but the `import './list';` [must be included](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js#L16) in order to import all your generated static page components. Do not change the path and you can ignore the fact that this file doesn't exist, it will be created on build in memory.  In the [render function](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js#L21-L26), it must include somewhere:

```html
<lit-route path="/" component="home-page"></lit-route>
MYROUTES
```

`MYROUTES` is a placeholder for where all your generated page routes will be automatically placed. It must be present beneath a default root directory. You may change the component of this root route but not the path.

### Page Template

All page templates must be placed in the `src/templates` directory. All page templates must be named [somename]-template.js.  The default page template is [page-template.js](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/page-template.js) which you can override simply by including it. To import your markdown files within a given page-template, you must [include the placeholder](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/page-template.js#L3) `MDIMPORT`. To set the position of where the markdown content will be placed within your page template, you must include an `<entry></entry>` placeholder element for the generated markdown component. For example:

```html
<div class='page-template content'>
    <entry></entry>
</div>
```

### Components

All additional imported components in your templates must be placed within the `src/components` directory.