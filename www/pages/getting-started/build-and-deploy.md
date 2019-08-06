## Build and Deploy

Congrats!  After all our good work making our first site, it's now time to host the code!

## Building For Production
If you'll recall from the project setup section, we created an npm script for running Greenwood's build command.  If you don't already have it in your package.json you will want to add this to your scripts section.

```render bash
// after
"scripts": {
  ...

  "build": "greenwood build",
},
```

And from the command line, run `npm run build`.  That's it!

If you look in your project, you will now have a _public/_ directory that will contain all the static assets you will need to run your site.  At this point, you can now put these assets on any web server like Apache, S3, Express, or Netlify (which is what this website uses!)

## Deploying and Hosting
There are many ways to host and deploy a Greenwood site, but essentially any static hosting or web server will work.  For the Greenwood website, our code is in GitHub and we use [Netlify](https://www.netlify.com/) to deploy from our GitHub repo.  

With Netlify, Greenwood configuration is straightforward.  Here is what our Netlify configuration looks like.

![greenwood-netlify-config](/assets/greenwood-netlify-config.png)


We hope to add more guides for common hosting solutions but the beauty of Greenwood and static sites is that they can run just about anywhere with little or no configuration at all.