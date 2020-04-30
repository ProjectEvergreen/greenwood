---
title: 'Deploy on Now'
menu: side
linkheadings: 3
index: 5
---

## Deploying your site on Now

Requires an account with [Vercel](https://vercel.com/) liked to your GitHub account. If you need to sign up, the process is simple as is the deployment.

After you have created your Greenwood project and pushed your code to a GitHub repo...

- log in to your Vercel account and proceed to the dashboard.
- click the 'Import Project' button
- in the 'From Git Repository' block, click 'continue'
- The default tab is for GitHub (what we will be using), GitLab & Bitbucket are also supported but not tested for this guide.
- Click 'Import Project from GitHub'
- Find an click 'select' next to the relevant Repository, then click 'Import'
- Next you can change the projects name (optional) then click 'continue'
- the next screen asks for the path to the root directory, leave blank for the root and click 'continue'
- next, the selection for framework should be automatically set to 'other', if not select it
- in 'build command' enter `yarn build`
- in 'output directory' enter `public`
- click 'deploy'

Done. It will start building your first deployment and will update each time you make changes to the master branch of your repo.
