
## Overview
In the [previous section](/getting-started/project-setup) we setup our local development environment and installed Greenwood.  We also made a "workspace" for our project files as a directory called _src/_.

Although Greenwood works without any configuration or setup, (go ahead, run `npm run build`, you'll get a default site right out of the box!), you will of course want to create your own site with your own content.  

For this reason, the minimum requirements for a site that you will need to provide are:
1. Workspace
1. Template(s)
1. Page(s)

In this section, we hope you'll get a better understanding of these two key concepts and how they can be used to create as many layouts and pages as you need to build out your site however you need.

## Workspace
In the project setup section, we created a _src/_ directory at the root of the directory of the project.  To Greenwood, this is called your workspace, and where are the files for your project need to reside, including the next two key concepts; templates and pages.

This starts our project with this structure:
```render bash
.
├── package-lock.json
├── package.json
└── src/
```

> Aside from these templates and pages directories, you can use any name you want for your other directories since your templates will be able to use `import` to pull in anything you need.  This will be demonstrated more fully in the next section.


## Templates
Templates are used to define the various layouts you will need for your site and should be put into a _templates/_ directory in your workspace directory.  You will need to define at least one page template for your project in order to get control over the output of your site, called _page-tempate.js_. 


So using the project structure we setup previously, with a default template to handle page generation would now look like this:
```render bash
.
├── package-lock.json
├── package.json
└── src
    └── templates
        └── page-template.js
```

For reference, here's what the default page template included by Greenwood looks like (using `LitElement`).
```render javascript
import { html, LitElement } from 'lit-element';
MDIMPORT;
METAIMPORT;
METADATA;

class PageTemplate extends LitElement {
  render() {
    return html\`
      METAELEMENT
      <div class='wrapper'>
        <div class='page-template content'>
          <entry></entry>
        </div>
      </div>
    \`;
  }
}

customElements.define('page-template', PageTemplate);
```

> Don't worry too much about the lines after the `import`, this is discussed in more detail in our [docs](/docs/).


## Pages
Pages are how you will create the content for your site by (generally) creating markdown files.  Simply make a _pages/_ directory in your workspace and Greenwood will start building them automatically.  By default, pages will build using the default page template (_page-template.js_).

By adding our home page (index.md), our directory sturcture for a basic Greenwood application now looks like this:
```render bash
.
├── package-lock.json
├── package.json
└── src
    ├── pages
    │   └── index.md
    └── templates
        └── page-template.js
```

And the sample home page provided by Greenwood out of the box looks like this
```render md
### Greenwood

This is the home page built by Greenwood. Make your own pages in src/pages/index.js!
```


Ok, so with the key concepts of templates and page covered, you're now [ready to start](/getting-started/creating-content/) creating content and developing your first Greenwood site!