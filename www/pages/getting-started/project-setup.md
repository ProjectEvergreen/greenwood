## Overview
In the [previous section](/getting-started/), we shared a little bit about what Greenwood is and the high level goals of this guide.  Now we are ready to help you start your first project!  

In this section, we will kick off our Greenwood project by:
1. Initailizing our project for development with **npm**
1. Installing Greenwood and setting up some `npm` scripts for local development
1. Setting up the needed project structure

> _This guide assumes you are starting from an **empty** directory (`git init` being the exception).  We recommend going through this guide once to understand the basics and from there, you can explore our [documentation](/docs/) to learn more about all of Greenwood's capabilities._

### Installing Greenwood
First thing we need to do is setup our project for installing Greenwood.  With Greenwood installed, you will be able to use its CLI to power the development of your project though automated scripts and configuration.

First thing we need to do is generate a _package.json_ file so we can install Greenwood.  The easist way to do that is by running `npm init` from the root directory of where you want to start your project :
```render shell
# hit enter to accept all defaults, or provide your own values
$ npm init
```

Now we can install Greenwood
```render bash
$ npm install @greenwood/cli --save-dev
```

All set!

### Configuring Workflows
With Greenwood installed, let's create a couple of **npm** scripts so that we can automate our development workflows with easy to remember commands.

In _package.json_, edit the `scripts` section accordingly:
```render json
// before
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1"
},

// after
"scripts": {
  "build": "greenwood build",
  "start": "greenwood develop"
},
```

Now, you'll be able to do two things:
1. `npm start` - Start a local development server with file watching and reloading.
1. `npm run build` - Generate a static version of the project that you can then upload to a web server.

You can go ahead and try out both of these tasks now, and you should see Greenwood's default generated output, letting you know you've set everything up correctly.


> _You can rename `build` and `start` to whatever you like, but this is what will be used for the sake of this guide._


### Project Structure
OK, almost there!  Let's quickly review what a basic project structure for Greenwood will look like.  At this point, your project should look something like this:
```render bash
.
├── node_modules/
├── package-lock.json
└── package.json
```

As we get ready to move onto the next section, your project will need a "workspace", which is basically just the name of the directory where your project files will go.  For now, let's just use Greenwood's default, which is _src/_.  After creating that directory, this is what your project structure should look like now:

```render bash
.
├── node_modules/
├── package-lock.json
├── package.json
└── src/
```

> At this point, if you are in `git` repository, it might be a good time to create a _.gitignore_ file and add the following directories: `.greenwood/`, `node_modules/` and `public/`.


Ok, now what we have our project ready, there's just one last thing to review before jump right in, but we promise it will be quick.  Please head on over to the next section in our guide to learn about Greenwood's [key concepts](/getting-started/key-concepts).