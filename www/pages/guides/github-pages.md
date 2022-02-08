---
title: 'Deploy with GitHub Pages'
menu: side
linkheadings: 3
index: 2
---

## Deploying your site with GitHub Pages

In this guide we'll walk through the steps for setting up a [GitHub Pages](https://pages.github.com/) for your GitHub repository with GitHub Actions.  With this setup, anytime you push to the designated branch, GitHub will automatically build your project with Greenwood and publish to GitHub Pages!

> _As a reference, the **Project Evergreen** [website repository](https://github.com/ProjectEvergreen/projectevergreen.github.io) is configured using this exact setup._

### Prerequisites

Following the steps [outlined here](https://pages.github.com/), first make sure you have already:
1. Created a repo in the format `<username>.github.io`
1. Greenwood [installed and setup](/getting-started/) in your repository, ex.
    ```shell
    src/
      pages/
        index.md
    package.json
    ```

### Setup

With the above in place, let's set everything up!

1. If you don't have a build script, let's add one to _package.json_ to use in our GitHub Action
    ```json
    {
      .
      .

      "scripts": {
        "build": "greenwood build"
      }
    }
    ```
1. Create a file called _.github/workflows/gh-pages.yml_ in the repo
1. Now add this GitHub Action, making sure to use the correct branch name for your project; _master_, _main_, etc.  (We're leveraging [this action](https://github.com/marketplace/actions/github-pages-action) at the end for the actual auto deploy.)
    ```yml
    name: Deploy GitHub Pages

    on:
      push:
        branches:
          - main # change this to match your repo

    jobs:

      build-and-deploy:
        steps:
        - uses: actions/checkout@v2
        - uses: actions/setup-node@v2
          with:
            node-version: 14.x

        - name: Install Dependencies
          run: |
            npm ci # or yarn install if using Yarn

        - name: Build
          run: |
            npm run build

        - name: Deploy GitHub Pages
          uses: peaceiris/actions-gh-pages@v3
          if: ${{ github.ref == 'refs/heads/main' }} # change the branch name to match your repo
          with:
            github_token: ${{ secrets.GITHUB_TOKEN }}
            publish_dir: ./public
    ```
1. Now `git` commit that and push it to your repo!

If all was successful, you should now see a [`gh-pages` branch](https://github.com/ProjectEvergreen/projectevergreen.github.io/tree/gh-pages) in your repo with the output of the _public/_ directory committed to it.  (your specific file output may differ, but it should match the output you see if you run `greenwood build` locally.)

> _You can see the status of any Action by going to the [Actions tab](https://github.com/ProjectEvergreen/projectevergreen.github.io/actions) of your repo_

![github pages branch](/assets/gh-pages-branch.png)


Now, configure your repository by going to your [repo's _Settings -> Pages_](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and make the following changes.
1. Set the source branch to **gh-pages**
1. Set path to be **/root**
![github pages branch](/assets/repo-github-pages-config.png)

### Next Steps

Now, everything should be setup so that on future pushes to the branch specified in the GitHub Actions workflow, GitHub pages should automatically build from the `gh-pages` branch and publish that.  🏆

![github pages branch](/assets/gh-pages-branch-commits.png)


Congrats, enjoy working on your website!!  🥳