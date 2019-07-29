## Overview
After having had a chance to setup our [project workspace](/getting-started/project-setup/) and reviewing some of Greenwood's [key concepts](/getting-started/key-concepts/), it's now time to get to the good stuff; writing some content and building your first site!

## Objectives
In this section, we'll walk through developing a site with Greenwood, and making some content.  We'll provide all the content, you just follow along.  By the end, you'll have a simple blog starter that you can buidl adn deploy on to any web server you like, be it Netlify, Apache, Express, or S3.  What you do from there, is all up to you!  

What we'll build:
1. Home Page Template: Single column layout for our home page
1. Blog Page Template: Two column layout for our blog posts
1. Blog Posts - A few sample pages of content to get you going
1. Header / Footer Components - Something to brand your site with
1. CSS - Some basic styles for our site

To go along with this guide, check out the [getting started repo](https://github.com/thescientist13/greenwood-getting-started) that has a working example of all the issue covered in this Getting Started guide, including the code for this sample project.  In the end, what you will end up with a project looking something like this:
```render shell
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
        ├── blog-template.js
        └── page-template.js
```

## 1) Creating The Home Page
Out of the box, Greenwood provides some default content, so even if we use our npm build script, `npm build` right now, we will get a working site in the public directory.  (go ahead and try it out!)


Neat!  But naturally you're here to learn how to make your own site, and this is goal here!  The first step towards making your site is to create a home page.  For this site, the home page will be a "full width" page.  

1) For the template, create a _page-template.js_ in _src/templates/_ and include this code in it.
```render javascript
TBD
```

2) For the content, create a markdown file called _index.md_ in _src/pages/_ and add some content to it, for example
```render md
# My Blog - Home Page
This is the home page for my blog, thank you for visiting!
``` 

## 2) Development Server
At this point we have two page templates and some home page content, so let's fire up the development server and see what things look like!

1) Run our development command
```render bash
# using the npm script we made during project setup
$ npm start
```

2) Once the development server is ready, it will let you know that you can now open `localhost:1984` in your web browser.  Doing so should yield you a page like this!

image TODO


Congrats, you've got your first Greenwood site running!  Now let's add some more content, styles, and a little branding to enhance things a little  bit more!



## 3) Creating Blog Posts


## 4) Using CSS and Images
OK, so we've made some content now, but things look a little plain.  Adding some styles and images is easy in Greenwood.  

#### CSS
theme.css

#### Assets
logo

## 5) Reusable Components (Header / Footer)
Any

