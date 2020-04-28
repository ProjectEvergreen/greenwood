## Deploy on Firebase

You will need an account, go to [https://firebase.google.com/](https://firebase.google.com/) get everything setup.

Install the Firebase CLI tool:

```render bash
npm i -g firebase-tools
```

In your browser go to your firebase console
  - then click 'Add a Project'
  - create a name for your Project
  - choose if you want analytics added to your project (optional)
  - click 'Create Project' and wait for it to get setup

In your Terminal, log into your firebase account

```render bash
firebase login
```

Initialize your project

```render bash
firebase init
```

Use the arrows to highlight 'Hosting: Configure and deploy Firebase Hosting sites' use the space select this option and then enter to confirm.

Compile your code:

```render bash
yarn build
```

then

```render bash
firebase use --add
```

select the targeted project, add an alias for the deployment, then

 ```render bash
firebase deploy
```

Your application will be accessible now at the domain <YOUR-FIREBASE-APP>.firebaseapp.com
