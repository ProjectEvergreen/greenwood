---
title: 'Deploy on Netlify'
menu: side
linkheadings: 3
index: 1
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
