---
title: 'Deploy on Netlify'
menu: side
linkheadings: 3
index: 1
---

## Deploying your site on Netlify

Requires an account with [Netlify](https://www.netlify.com) linked to your GitHub account. If you need to sign up, the process is simple as is the deployment.

After you have created your Greenwood project and pushed your code to a GitHub repo...

- Log in to your Netlify account and proceed to the dashboard.
- Click the 'Import new site from Git' button in the upper right corner of the screen
- Click the 'GitHub' button
- Find and select the relevant repository
- In 'build command' enter `yarn build`
- In 'output directory' enter `public`
- Click 'deploy site'

Done. It will start building your first deployment and will update each time you make changes to the master branch of your repo.
