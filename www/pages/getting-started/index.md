---
label: 'getting-started'
---

## Introduction
First off, thank you for taking the time to check out Greenwood!  As a tool, we hope that you find Greenwood to provide a productive and frictionless developer experience for you that results in performant and engaging experiences for your users.  Under the hood Greenwood is using NodeJS, webpack, babel and a lot of other amazing JavaScript tools to power a modern development workflow based on first class support for the modern web, like Web Components, FlexBox, CSS Grid, ECMAScript modules, and all your favorite JavaScript features!

## Your First Project
However, to get things started, we first want to make sure everyone can get their first project up and running as easily and quickly as possible, and so through this guide, we will help walk you through everything you need to get started with your first project, including
1. Setting up your workspace and installing Greenwood
1. Reviewing the concepts of "pages" and "templates"
1. Creating content and developing locally
1. CSS and Web Components
1. Building for production, and hosting

## Prequisites
Before going into the setup section of the tutorial, we want to make sure that everyone is aware of the expectations and assumptions this guide (and Greenwood) make.

#### NodeJS and the Command Line (CLI)
[NodeJS](https://nodejs.org/) is the environment used for running Greenwood (from the command line).  We recommend installing the _LTS_ version of NodeJS onto your machine and being familliar with [**npm**](https://www.npmjs.com/), the package manager that comes with NodeJS.  The command line will be the primary mechanism for:
- Installing Greenwood
- Running scripts from the command line

You can test that both are installed correctly from the command line by testing the output of the following commands:
```render bash
$ node -v
$ npm -v

# for example
$ node -v
v10.15.1

$ npm -v
6.4.1
```

Along with this, familiarity of the command line / terminal is also assumed as Greenwood is a command line tool, so all examples will assume a bash / shell like environment.  Example commands used in this guide are:
```render bash
# create a directory for your project and change into it
$ mkdir my-project
$ cd my-project

# installing packages with npm 
$ npm install <package>

# running a custom npm script
$ npm run develop
```

#### Experience
No advanced JavaScript / CSS experience is needed for using Greenwood.  Just knowing some [markdown]() and following some basic steps from the command line will be enough to get you up and running.  

What we like about Greenwood is that as your experience grows, so can the way you build your site.  Greenwood has very opinions on how you structure your site or what you're trying to build or how.  We hope to give you the workflow you need and that you can do with it as much or as little as you want.

## Resources
Here are some resources and docs that we think might be useful as part of a broader understanding of the topic of web development in general
- [MDN](https://developer.mozilla.org/) - Mozilla's (Web) Developer Docs.  A must have resource for web development
- [CanIUse.com](https://caniuse.com/) - Find out what browser support various JS / CSS features have
- [LitElement](https://lit-element.polymer-project.org/) / [LitHtml](https://lit-html.polymer-project.org/) - Helper libraries for working with Web Components, available through Greenwood
- [VSCode](https://code.visualstudio.com/) - A very popular IDE for JavaScript development with a lot of great plugins and integrations for web development related tools
- [Git](https://git-scm.com/) / [GitHub](https://github.com/): Although git != GitHub, version control plays a very important part in modern software development.  GitHub in particular provides a lot of great integrations with tools like [CircleCI](https://circleci.com/) and [Netlify](https://www.netlify.com/) that can greatly automate a lot of the deployment process like building and deploying your apps.  (We plan to provide guides for these in the future, so stay tuned!)


Ready to get started?  [Let's go](/getting-started/project-setup/)!