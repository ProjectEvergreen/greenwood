---
label: 'creating-content'
menu: side
title: 'Creating Content'
index: 4
linkheadings: 3
---

## Overview
After setting up our [project workspace](/getting-started/project-setup/) and reviewing some of **Greenwood**'s [key concepts](/getting-started/key-concepts/), it's now time to get to the good stuff: writing some content and building your first site!

### Objectives
In this section, we'll walk through developing a site with Greenwood, and making some content.  We'll provide all the code, so you can just follow along.  By the end, you'll have a simple blog starter that you can build and deploy to any web server you like, be it Netlify, Apache, Express, or S3.  What you do from there, is all up to you!

What we'll cover in this section:

1. Home Page Template: Single column layout for our home page
1. Blog Page Template: Two column layout for our blog posts
1. Blog Posts: A couple sample pages of content written in markdown
1. Using Greenwood's built in local development server

To go along with this guide, check out our [companion repo](https://github.com/ProjectEvergreen/greenwood-getting-started) that has a working example of all the code covered in this Getting Started guide.  In the end, what you will end up with is a project looking something like this:
``` shell
.
├── package-lock.json
├── package.json
└── src
    ├── components
    │   ├── footer.js
    │   └── header.js
    ├── pages
    │   ├── blog
    │   │   ├── first-post.md
    │   │   └── second-post.md
    │   └── index.md
    ├── styles
    │   └── theme.css
    └── templates
        ├── blog.html
        └── page.html
```

### Home Page Template
Out of the box, Greenwood provides some default content, so even if we use our npm build script, `npm build` right now, we will get a working site in the public directory.  (go ahead and try it out!)


Neat!  But naturally you're here to learn how to make your own site, and this is our goal!  The first step towards making your site is to create a home page.  For this site, the home page will be a "full width" page.

For this template, create a _page.html_ in a _src/templates/_ (make the _templates/_ directory if it doesn't exist) and include this code in it:

```html
<html>

  <body>
    <content-outlet></content-outlet>
  </body>
  
</html>
```

### Blog Posts Template
We just made a template for our home page, but for our indivdual blog posts, we're going to want a different layout for those pages.  So what do we do?   Just create a new template!

Create a _blog.html_ in _src/templates/_ and include this code in it.
```html
<html>

  <body>
    <content-outlet></content-outlet>
  </body>
  
</html>
```

> _Right now both of these templates are the same, but we'll be customizing these both shortly._  👇

### Creating Pages
To make our home page which will use the default _page.html_ layout we just created, create an _index.md_ file in the _src/pages/_ directory.

```md
## Home Page

This is the Getting Started home page!

### My Posts
- [My Second Blog Post](/blog/second-post/)
- [My First Blog Post](/blog/first-post/)
```


For these blog posts, we can give them their own unique URLs by simply putting them in their own directory and by default Greenwood will "slugify" based on that file path and generate routes / pages accordingly.

You'll want to create a folder called _blog/_ in _src/pages/_ and then create two markdown files called _first-post.md_ and _second-post.md_.

_first-post.md_
```md
---
template: 'blog'
---

## My First Blog Post
Lorem Ipsum

[back](/)
```

_second-post.md_
```md
---
template: 'blog'
---

## My Second Blog Post
Sed ut perspiciatis

[back](/)
```

We are using something called ["front matter"](/docs/front-matter) to specify that these pages should use the _blog_ template we just created.

### Development Server
At this point we have two page templates and three pages of content, so let's fire up the Greenwood development server and see what things look like!

```bash
# using the npm script we made during project setup
$ npm start
```

Once the development server is ready, it will let you know that you can now open `localhost:1984` in your web browser.  Doing so should yield you a page like this!

![greenwood-getting-started-unstyled](/assets/getting-started-repo-unstyled-partial.png)


Congrats, you've got your first **Greenwood** site running!  It's coming along but still needs a little work.  In the [next section](/getting-started/branding/) we'll create some reusable Web Components for the site's header and footer as well as introduce some CSS for styling.