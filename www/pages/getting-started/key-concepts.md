---
label: 'key-concepts'
menu: side
title: 'Key Concepts'
index: 3
linkheadings: 3
---

## Overview
In the [previous section](/getting-started/project-setup) we setup our local development environment and installed Greenwood.  We also made a "workspace" for our project files in a directory called _src/_.

Although Greenwood works without any configuration or setup, (go ahead, run `npm run build`, you'll get a default site right out of the box!), you will of course want to create your own site with your own content.

For this reason, the minimum requirements for a site that you will want to be familiar with are:

1. Workspace
1. Templates
1. Pages

In this section, we hope you'll get a better understanding of key concepts and how they can be used to create as many layouts and pages as you need to build out your own site however you need.

### Workspace
In the project setup section, we created a _src/_ directory at the root of the directory of the project.  To Greenwood, this is called your workspace and where are the files for your project need to reside, including the next two key concepts: templates and pages.

This gives our project the following structure:
```bash
.
├── package-lock.json
├── package.json
└── src/
```

> Aside from these templates and pages directories, you can use any name you want for your other directories since your templates will be able to use JavaScript module with `import` to pull in anything you need.  This will be demonstrated more fully in the next section.


### Templates
Templates are used to define the various layouts you will need for your site and should be put into a _templates/_ directory in your workspace directory.  You will need to define at least one page template for your project in order to get control over the output of your site, called _page-tempate.js_.


So using the project structure we setup previously, adding your own custom page layout would leave you with a directory layout like this:
```bash
.
├── package-lock.json
├── package.json
└── src
    └── templates
        └── page.html
```

Any regular HTML will do.  You will just need to include a `<content-outlet></content-outlet>` HTML tag for where you will want your page content to appear.
```html
<html>

  <head>
    <style>
      body {
        color: 'royal-blue';
      }
    </style>
  </head>

  <body>
    <header>
      <h1>My Website</h1>
    </header>

    <section>
      <content-outlet></content-outlet>
    </section>

    <footer>
      <span>&copy My Website</span>
    </footer>
  </body>
  
</html>
```

Don't worry too much about the `<content-outlet></content-outlet>`, this is discussed in more detail in our [docs](/docs/layouts/).

### Pages
Pages are how you will create the content for your site by (generally) creating markdown files.  Simply make a _pages/_ directory in your workspace and Greenwood will start building them automatically.  By default, pages will build using the default page template: _page.html_.

By adding a home page (_index.md_), your directory structure for a basic Greenwood application would now look like this:
```bash
.
├── package-lock.json
├── package.json
└── src
    ├── pages
    │   └── index.md
    └── templates
        └── page.html
```

And the sample home page provided by Greenwood out of the box looks like this:
```md
### Greenwood

This is the home page built by Greenwood.
```


Ok, so with the key concepts of workspaces, templates and pages covered, you're now ready to start [creating content](/getting-started/creating-content/) and developing your first Greenwood site!
