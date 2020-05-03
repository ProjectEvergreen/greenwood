---
title: 'Deploy on Now'
menu: side
linkheadings: 3
index: 5
---

## Deploying your site on Now

Requires an account with [Vercel](https://vercel.com/) linked to your GitHub account. If you need to sign up, the process is simple as is the deployment.

After you have created your Greenwood project and pushed your code to a GitHub repo...

1. Log in to your Vercel account and proceed to the dashboard.

2. Click the 'Import Project' button

3. In the 'From Git Repository' block, click 'continue'

4. The default tab is for GitHub (what we will be using), GitLab & Bitbucket are also supported but not tested for this guide.

5. Click 'Import Project from GitHub'

6. Find an click 'select' next to the relevant Repository, then click 'Import'

7. Next you can change the projects name (optional) then click 'continue'

8. the next screen asks for the path to the root directory, leave blank for the root and click 'continue'

9. next, the selection for framework should be automatically set to 'other', if not select it

10. In 'build command' enter `yarn build`

11. In 'output directory' enter `public`

12. Click 'deploy'


Done. It will start building your first deployment and will update each time you make changes to the master branch of your repo.
