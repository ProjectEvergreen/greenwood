---
title: 'Deploy on Netlify'
collection: guides
tocHeading: 3
order: 1
---

## Deploying your site on Netlify

Requires an account with [Netlify](https://www.netlify.com) linked to your GitHub account. If you need to sign up, the process is simple as is the deployment.

After you have created your Greenwood project and pushed your code to a GitHub repo...

1. Log in to your Netlify account and proceed to the dashboard.

1. Click the **Import new site from Git** button in the upper right corner of the screen.

1. Click the **GitHub** button.

1. Find and select the relevant repository.

1. In **build command** enter  `yarn build`

1. In **output directory** enter  `public`

1. Click **deploy site**

Done. It will start building your first deployment and will update each time you make changes to the master branch of your repo.

> We recommend **_disabling_** Netlify [Asset Optimization](https://www.netlify.com/blog/2019/08/05/control-your-asset-optimization-settings-from-netlify.toml/) since it could lead to [duplicate asset serving](https://community.netlify.com/t/asset-optimization-preloading-fonts/3197/7). Greenwood will do all the bundling / minifying you need.  You can review the [_netlify.toml_](https://github.com/ProjectEvergreen/greenwood/blob/master/netlify.toml) to see what configuration we're using for the Greenwood website.  More information available [here](https://docs.netlify.com/configure-builds/file-based-configuration/) about Netlify configuration files.