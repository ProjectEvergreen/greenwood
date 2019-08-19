---
template: 'home'
---

```render
<div class="message">
  <h2>Greenwood is a modern and performant static site generator for Web Component based development.</h2>

  <p>Greenwood is focused on providing an intuitive and accessible development workflow supporting modern JavaScript and CSS features like Web Components, FlexBox, CSS Grid, and Modules.  Greenwood strives to deliver not only great user experiences, but also great developer experiences.  To learn more about the project we encourage everyone to first go through our <a href="/getting-started/">Getting Started</a> guide.  You can learn more about the project itself at our <a href="/about">about page</a> or see our <a href="/docs"/>documentation</a> to learn more about how to use Greenwood.</p>

  <p>Greenwood works great within the <a href="https://jamstack.org/" target="_blank" rel="noopener">JAMStack paradigm</a>.  Not familiar with it?  Check out <a href="https://www.youtube.com/watch?v=grSxHfGoaeg" target="_blank" rel="noopener">this talk on the topic</a> from <a href="https://jamstackconf.com/" target="_blank" rel="noopener">JAMStack Conf.</a</p>

  <hr/>
</div>

<div class="cards">
  <eve-row>

    <eve-card title="webpack" img="/assets/webpack.svg" size="full" style="width:100%">
      To us, webpack is more than a module bundler, it's an entire development ecosystem!  We use webpack
      under the hood to power the development workflow and to help generate a performant site for you with the power of tools like Babel and PostCSS.  The best part?  You don't have to know anything about that!  Greenwood handles all the configuration and optimizations for you, so you can be sure that your users will get the best experience possible, and as a developer, so will you.
    </eve-card>

    <eve-card title="Web Components" img="/assets/webcomponents.svg" size="full" style="width:100%">
      Do we love Web Components?  You bet we do!  In fact, it's one of many things we love about the modern web, including other features like Modules, FlexBox and CSS Grid, Fetch API, and more!  It's all there for you in the browser, and with Greenwood, we make sure all those features will work for all your users.  Sit back and write the modern code you want and Greenwood will take care of the rest.
    </eve-card>

    <eve-card title="NodeJS" img="/assets/nodejs.png" size="full" style="width:100%">
      Although Greenwood generates a static site that you can host just about anywhere (Netlify, S3, Apache, etc), for developing and building your site Greenwood requires NodeJS to be available on the command line.  This allows us to tap into all the amazing web development tools and libraries available on npm and also means you can use those packages too when developing your own site!  Greenwood will aim to support the latest LTS release of NodeJS and the version of npm that comes with.
    </eve-card>

  </eve-row>
</div>
```
