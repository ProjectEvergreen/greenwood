---
template: 'home'
---

## Greenwood is a modern and performant static site generator.

This is the Greenwood website's home page!  🌱

Visit our [about page](/about) to learn more!
Greenwood is focused on providing an intuitive and accessible development workflow supporting modern JavaScript and CSS features like Web Components, FlexBox, CSS Grid, and Modules.  We hope that the development experience is as pleasant and performant as the resulting user experience and that you'll be just as happy building your own site as we are with building Greenwood.

Click [here](/about) to learn more about the project, or for more advanced topics please head over to our [Documentation page](/docs).


```render
<div class="cards">
  <eve-row>

    <eve-card title="webpack" img="/assets/webpack.svg" size="full">
      To us, webpack is more than a module bundler, it's an entire development ecosystem!  We use webpack
      under the hood to power the development workflow and to help generate a performant site for you with the power of tools like Babel and PostCSS.  The best part?  You don't have to know anything about that!  Greenwood handles all the configuration and optimizations for you, so you can be sure that your users will get the best experience possible, and as a developer, so will you.
    </eve-card>
  
    <eve-card title="Web Components" img="/assets/webcomponents.svg" size="full">
      Do we love Web Components?  You bet we do!  In fact, it's one of many things we love about the modern web, including other features like Modules, FlexBox and CSS Grid, Fetch API, and more!  It's all there for you in the broweer, and with Greenwood, we make sure all those features will work for all your users.  Sit back and write the modern code you want and Greenwood will take care of the rest.
    </eve-card>
  
    <eve-card title="NodeJS" img="/assets/nodejs.png" size="full">
      Although Greenwood generates a static site that you can host just about anywhere (Netlify, S3, Apache, etc), for developing and building your site, Greenwood requires NodeJS to be available on the command line.  This allows us to tap into all the amazing web development tools and libraries available on npm and also means you can use those packages too when developing your own site!  Greenwood will aim to support the latest LTS release of NodeJS and the version of npm that comes with.
    </eve-card>

  </eve-row>
</div>
```