---
title: 'Deploy on Netlify'
menu: side
linkheadings: 3
index: 1
---

## Deploying your site on Netlify

Requires an account with [Netlify](https://www.netlify.com) liked to your GitHub account. If you need to sign up, the process is simple as is the deployment.

After you have created your Greenwood project and pushed your code to a GitHub repo...

- log in to your Netlify account and proceed to the dashboard.
- click the 'Import new site from Git' button
- click the 'GitHub' button
- Find an select the relevant repository
- in 'build command' enter `yarn build`
- in 'output directory' enter `public`
- click 'deploy site'

Done. It will start building your first deployment and will update each time you make changes to the master branch of your repo.
