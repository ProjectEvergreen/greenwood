## Overview
In the [previous section](/getting-started/), we shared a little bit about what Greenwood is and the high level goals of this guide.  Now we are ready to start your first project!  

In this section, we will get to kick off our Greenwood project by:
1. Initailizing our project for development with **npm**
1. Installing Greenwood and setting up some `npm` scripts for local development
1. Setting up the needed project structure

> _This guide assumes you are starting from an **empty** directory (`git init` being the exception).  We recommend going through this guide once to understand the basics and from there, you can explore our [documentation](/docs/) to learn more about all of Greenwood's capabilities._

## Installing Greenwood
First thing we need to do is setup our project for installing Greenwood.  With Greenwood installed, you will be able to use its CLI to power the development of your project though automated scripts and configuration.

First thing we need to do is generate a _package.json_ file so we can install Greenwood.  Easist way to do that is by running `npm init`:
```shell
# hit enter to accept all defaults, or provide your own values
$ npm init
```

Now we can install Greenwood
```shell
$ npm install @greenwood/cli --save-dev
```

All set!  

> _At this point, if you are in `git` repository, it might be a good time to create a _.gitignore_ and add `_ node_modules` to it._


## Configuring Development Workflows
With Greenwood installed, let's create a couple of **npm** scripts so that we can automate our development workflows with easy to remember commands.

In _package.json_, edit the `scripts` section accordingly:
```shell
# before
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1"
},

# after
"scripts": {
  "build": "greenwood build",
  "start": "greenwood develop",
  "test": "echo \"Error: no test specified\" && exit 1"
},
```

Now, you'll be able to do two things:
1. `npm start` - Will start a local development server with file watching and reloading.
1. `npm run build` - Will generate a static version of the project that you can then upload to a web server.

You can go ahead and try out both of these tasks now, and you should see Greenwood's default generated output, letting you know you've set everything up correctly.


> _You can rename `develop` and `build` to whatever you like, but this is what will be used for the sake of this guide._


## Project Structure
OK, almost there!  Last thing to go over is what a basic project structure for Greenwood will look like.  At this point, your project should look something like this:
```shell
$ tree
.
├── node_modules/
├── package-lock.json
└── package.json
```

As we get ready to move on the next section, your project will need a "workspace", which is basically just the name of the directory where your project files will go in.  For now, let's just use Greenwood's default, which is a _src/_ directoey.  After creating that directory, this is what your project structure should look like now:

```shell
$ tree
.
├── node_modules/
├── package-lock.json
├── package.json
└── src/
```

> At this point, if you are in `git` repository, it might be a good time to create a _.gitignore_ file and add `node_modules/` and `public/` to it.


Ok, now what we have our project ready, there's just one last thing to review, but it's quick!  Please head on over to the next section in our guide on Greenwood's [Key Concepts](/getting-started/key-concepts).