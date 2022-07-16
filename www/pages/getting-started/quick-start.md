---
label: 'quick-start'
menu: side
title: 'Quick Start'
index: 1
linkheadings: 3
---

## Quick Start

If you want to get right into the code, we have a few options to get you started Greenwood:

- Init Command
- Command Line (w/ `npx`)
- Clone GitHub Repo
- Stackblitz ⚡

### Init Package

You can use Greenwood's [`init` package](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/init/README.md) to scaffold out a new empty Greenwood project, or from a template.

```bash
mkdir my-app && cd my-app

npx @greenwood/init@latest
```

### Command Line

Additionally, you can start your own project right now as easy as 1.. 2.. 3, right from your terminal!
```bash
# with NodeJS already installed
# create a pages directory for your content
$ mkdir -p src/pages

# create an index.md file as your home page
$ echo "## hello world" > src/pages/index.md

# run one of Greenwood's commands, and that's it!
$ npx @greenwood/cli@latest develop
```

### Clone GitHub Repo
If you just want to _clone and go_ then we welcome you to check out the [companion repo](https://github.com/ProjectEvergreen/greenwood-getting-started) we made to accompany this guide.  To get the code from this walk-through, you can simply clone the repo, install dependencies, and off you go!

```bash
$ git clone https://github.com/ProjectEvergreen/greenwood-getting-started
$ cd greenwood-getting-started

$ npm install

$ npm start
```

Done!

### Stackblitz

Greenwood thinks there's a world where you never have to leave the browser to build and author content for your site, and after you see our starter working [in Stackblitz](https://stackblitz.com/github/projectevergreen/greenwood-getting-started?embed=1), we think you'll be a believer too!

<iframe src="https://stackblitz.com/github/projectevergreen/greenwood-getting-started?embed=1" class="stackblitz" loading="lazy"></iframe>

----

_To learn more about what you can do with Greenwood, head over to our [documentation](/docs/) or feel to review the other sections in this guide.  To setup a project from scratch, you can pick up the rest of the getting started guide on the [project setup](/getting-started/project-setup) page._