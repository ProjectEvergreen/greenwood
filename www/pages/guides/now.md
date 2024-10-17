---
title: 'Deploy on Now'
collection: guides
tocHeading: 3
order: 4
---

## Deploying your site on Now

Requires an account with [Vercel](https://vercel.com/) linked to your GitHub account. If you need to sign up, the process is simple as is the deployment.

After you have created your Greenwood project and pushed your code to a GitHub repo...

1. Log in to your Vercel account and proceed to the dashboard.

1. Click the **Import Project** button

1. In the **From Git Repository** block, click **continue**

1. The default tab is for GitHub (what we will be using), GitLab & Bitbucket are also supported but not tested for this guide.

1. Click **Import Project from GitHub**

1. Find an click **select** next to the relevant Repository, then click **Import**

1. Next you can change the projects name (optional) then click **continue**

1. the next screen asks for the path to the root directory, leave blank for the root and click **continue**

1. next, the selection for framework should be automatically set to **other**, if not select it

1. In **build command** enter `yarn build`

1. In **output directory** enter `public`

1. Click **deploy**


Done. It will start building your first deployment and will update each time you make changes to the master branch of your repo.