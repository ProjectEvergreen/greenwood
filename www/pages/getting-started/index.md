---
label: 'getting-started'
menu: navigation
title: 'Getting Started'
index: 3
---

## Introduction
First off, thank you for taking the time to check out **Greenwood**!  Under the hood Greenwood is taking advantage of the power of the modern web ([and friends !](/docs/tech-stack/)) to drive a modern development workflow that helps you deliver a modern, performant and pleasent experience for your users... using the web languages you already know!

## Your First Project
To get things started, we first want to make sure everyone can get their first project up and running as easily and quickly as possible, and so through this guide, we will walk through everything you need to get started with your first project, including:

1. Setting up your project workspace and installing Greenwood
1. Reviewing key concepts of Greenwood
1. Creating content and developing locally
1. Authoring Web Components and adding CSS
1. Configuration
1. Building and hosting for production


## Prequisites
Before going into the setup section of the tutorial, we want to make sure that you are familiar with some of the expectations and assumptions this guide (and Greenwood) make.

#### NodeJS and the Command Line (CLI)
[NodeJS](https://nodejs.org/) is the environment used for running Greenwood from the command line.  We recommend installing the _LTS_ version of NodeJS onto your machine and being familiar with [**npm**](https://www.npmjs.com/), the package manager that comes with NodeJS.  The command line will be the primary mechanism for:
- Initializing your project
- Installing Greenwood
- Running scripts from the command line

You can test that both are installed correctly from the command line by verifying the output of the following commands:
```bash
$ node -v
$ npm -v

# for example
$ node -v
v12.13.0

$ npm -v
6.4.1
```

Along with this, familiarity of the command line / terminal is also assumed as Greenwood is a command line tool, and so all examples will assume a bash / shell like environment.  Example commands used in this guide are:
```bash
# create a directory for your project and change into it
$ mkdir my-project
$ cd my-project

# installing packages with npm
$ npm install <package>

# running a custom npm script
$ npm run develop
```

#### Experience
No advanced JavaScript / CSS experience is needed for using Greenwood.  Just knowing some [markdown](https://daringfireball.net/projects/markdown/) and following some basic steps from the command line will be enough to get you up and running quickly.

We like to think that that as your experience grows, so can the way you build your site.  Greenwood has very few opinions on how you structure your project (aside from pages and templates), or what you're trying to build, or how.  _Our hope is to provide you a developer experience that is conducive to modern web development and the expectations around it_.

## Tutorials
So if you're ready to get started, let's get [your first project setup](/getting-started/project-setup/)!  Or if you just want to "code and go", check out our [quick start](/getting-started/quick-start/).
