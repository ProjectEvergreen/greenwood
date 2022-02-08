---
title: 'Firebase Deployment'
menu: side
linkheadings: 3
index: 5
---

### Deploy on Firebase

You will need an account, go to [https://firebase.google.com/](https://firebase.google.com/) get everything setup.

Install the Firebase CLI tool:

```bash
npm i -g firebase-tools
```

In your browser go to your firebase console
  - then click 'Add a Project'
  - create a name for your Project
  - choose if you want analytics added to your project (optional)
  - click 'Create Project' and wait for it to get setup

In your Terminal, log into your firebase account

```bash
firebase login
```

Initialize your project

```bash
firebase init
```

Use the arrows to highlight 'Hosting: Configure and deploy Firebase Hosting sites' use the space select this option and then enter to confirm.

Compile your code:

```bash
yarn build
```

then

```bash
firebase use --add
```

select the targeted project, add an alias (referenced in the .firebaserc file at the root of your project, you can just use 'default') for the deployment, then

 ```bash
firebase deploy
```

Your application will be accessible now at the domain <YOUR-FIREBASE-APP>.firebaseapp.com

### Auto Deployment with GitHub Actions

Add your firebase token to GitHub Secrets as 'FIREBASE_TOKEN'; to get this run:

```bash
firebase login:ci
```


At the root of your project add '.github/workflows/main.yml'

```yml
name: Firebase Deployment

on:
  push:
    branches:
      - master

jobs:
  build:

    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v1
    - name: Install Chromium Library Dependencies
      run: |
       sh ./.github/workflows/chromium-lib-install.sh
    - name: Build
      run: |
        npm install
        npm run build
    - name: Firebase Deploy
      run: |
        sudo npm install -g firebase-tools
        firebase deploy --token ${{ secrets.FIREBASE_TOKEN }} -P your-firebase-project-name
```

In the same directory as main.yml create a file 'chromium-lib-install.sh'

```bash
#!/usr/bin/bash

sudo apt-get update \\
  && sudo apt-get install -yq libgconf-2-4 \\
  && sudo apt-get install -y wget --no-install-recommends \\
  && sudo wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - \\
  && sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \\
  && sudo apt-get update \\
  && sudo apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf --no-install-recommends \\
  && sudo rm -rf /var/lib/apt/lists/*
```

Now every change to the master branch will compile and push your code to firebase.