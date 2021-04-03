---
label: 'templates-and-pages'
menu: side
title: 'Templates and Pages'
index: 6
linkheadings: 3
---

## Templates and Pages

Greenwood has two types of templates to help layout your pages:

- _App Template_: The ["app shell"](https://developers.google.com/web/fundamentals/architecture/app-shell) that will wrap all pages.  One is provided for you by Greenwood, but you can override it if needed.
- _Page Templates_:  A template for each unique page layout within your site.  Common layouts are great for documentation and blog sites, but also great for single pages as well (like a splash layout for the home page).

> _**Note**: [For now](https://github.com/ProjectEvergreen/greenwood/issues/435), all paths in template files need to start with a `/` and omit the workspace directory._

### Page Templates
Pages in your project will generally want a template so you can control the output of the HTML and include all your own custom components and styles.  By default all pages will default to looking for a _page.html_ in _templates/ directory within your workspace.  


In order to make a page template, you just need to write up some HTML that can be enhanced with these special custom elements:
- Include `<content-outlet></content-outlet>` to position where the processed markdown from the page will appear
- Include `<meta-outlet></meta-outlet>` to position where `<meta>` tags should go 


Below is an example of a simple _page.html_.  You can just copy / paste this to start your own page templates and by default all your pages will start rendering using this layout.

```html
<!DOCTYPE html>
<html lang="en" prefix="og:http://ogp.me/ns#">

  <head>
    <meta-outlet></meta-outlet>
  </head>
  
  <body>
    <header>
      <h1>Welcome to my site!</h1>
    </header>
      
    <content-outlet></content-outlet>

  </body>
  
</html>
```

You can create more templates and use them for pages by doing two things:
1. Create a new template, e.g. _templates/blog-post.html_
1. In your frontmatter, specify that `template`
    ```md
    ---
    template: 'blog-post'
    ---

    ## My Blog Post
    Lorum Ipsum
    ```

> _See our [Front Matter Docs](/docs/front-matter#define-template) for more information._

### App Template

If you want to customize the outer most wrapping layout of your site, in the _templates/_ directory you can do this by creating an _app.html_ file.  Like a page template, this will just be another HTML document, with some additional capabilities:
- Include `<page-outlet></page-outlet>` to position where the content from the processed page template will appear
- Include `<meta-outlet></meta-outlet>` to position where `<meta>` tags goes.  _Make sure not to include this in your page templates!_

As with page templates, app templates are just HTML.

```html
<!DOCTYPE html>
<html lang="en" prefix="og:http://ogp.me/ns#">

  <head>
    <meta-outlet></meta-outlet>
  </head>

  <body>
    <header>
      <h1>Welcome to My Site!</h1>
    </header>
      
    <section>
      <page-outlet></page-outlet>
    </section>

    <footer>
      <h1>&copy; My Site</h1>
    </footer>

  </body>
  
</html>
```

> _When an app template is present, Greenwood will merge the `<head>` and `<body>` tags for both app and page templates into one HTML document structure for you._


> _**Tip:** If you use an _.html_ file instead of _.md_ for a page, you can use that as a page template override.  (since there will be no frontmatter).  This way you don't have to make a template for a one off page like a home page._

### Pages
You can create all your pages in a _pages/_ directory in your project's workspace which will in turn map to the generated file output and routes of your site.

For example, given this folder structure:
```shell
.
└── src
    ├── pages
        ├── blog
        │   ├── first-post.md
        │   └── second-post.md
        ├── about.md
        └── index.html
```

You will have the following page URLs accessible in the browser:
- _/_
- _/about/_
- _/blog/first-post/_
- _/blog/second-post/_

And the following file output in the _public/_ directory
```shell
.
└── public
      ├── blog
      │   ├── first-post
      │   │     └── index.html
      │   └── second-post
      │         └── index.html
      ├── about
      │     └── index.html
      └── index.html
```

> _See our [Front Matter Docs](/docs/front-matter#define-template) for more information on how you can extend fontmatter in **Greenwood**._

## Scripts and Styles

Since all pages and templates are just HTML with Greenwood, you can use `<script>`, `<style>`, and `<link>` tags as normal, referencing paths from your template to the location of the files in your project's workspace.

For example, here is what a standard app template might look like:
```html
<!DOCTYPE html>
<html lang="en" prefix="og:http://ogp.me/ns#">

  <head>
    <meta-outlet></meta-outlet>
    <link rel="stylesheet" href="/styles/theme.css"/>
    <script type="module" src="/components/app-header.js"></script>
    <script type="module" src="/components/app-footer.js"></script>
  </head>
  
  <body>
    <app-header></app-header>
      
    <page-outlet></page-outlet>

    <app-footer></app-footer>
  </body>
  
</html>
```

And the directory structure for it:
```shell
.
└── src
      ├── components
      │   ├── app-header.js
      │   └── app-footer.js
      ├── pages
      │   ├── index.md
      ├── styles
      │   └── theme.css
      ├── templates/
          └── app.html
```

> _It is recommended to use the "file" based approaches for loading JavaScript and CSS; `<script src="...">` and `<link rel="stylesheet" href="...">` respectively.  This will allow Greenwood to optimize these assets during both development and build workflows.  However, inline `<script>` and `<style>` can both be super helpful for one-off cases, so in those cases we recommend only relying on "vanilla" JS / CSS syntax. For more context, examples, and background information, you can [review this PR](https://github.com/ProjectEvergreen/greenwood/pull/472)._