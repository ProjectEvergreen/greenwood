---
label: 'next-steps'
menu: side
title: 'Next Steps'
index: 7
---

## Next Steps

### Learn More
Thank you so much for taking the time to go through our Getting Started guide and we hope it has given you a good overview of how to work with Greenwood and what some of the possibilities are.  To learn more about the project we encourage you to review our [API docs](/docs/) to learn more about how you can use Greenwood or check out our repo to see what we're [working on next](https://github.com/ProjectEvergreen/greenwood/projects), or if you need to reach out, feel free to [open an issue](https://github.com/ProjectEvergreen/greenwood/issues)!

### Configuration
Although configuration is a topic all on its own, we do want to walk through setting up a configuration file for your project.  As you may have noticed, the `<title>` of the site being made during the Getting Started section said _My Personal Blog_.  This is what Greenwood's configuration can be used for.

To change the title of the project (like in the companion repo), create a (NodeJS) module called _greenwood.config.js_ at the root of your project and configure the `export` object with a title property.

```javascript
export default {
  title: 'My Personal Site'
};
```

That's it!  You can learn more about configuring Greenwood [here](/docs/configuration).

### Resources
Since Greenwood aims to be a web "first" tool, all the great web development resources for the web already apply to Greenwood!  Below are some resources that we think might be useful as part of a broader understanding of the topic of web development and that we have found invalualable for our own development and learning.
- [MDN](https://developer.mozilla.org/) - Mozilla Developer Network has some of the best technical and sample content available for learning about all the features and capabilities of the web.
- [Web Components](https://www.webcomponents.org/introduction) - A brief introduction to the specs that make up Web Components.
- [CSS / Shadow DOM](https://developers.google.com/web/fundamentals/web-components/shadowdom)
- [CanIUse.com](https://caniuse.com/) - Find out what browser support various JS and CSS features have.
- [VSCode](https://code.visualstudio.com/) - A very popular IDE for JavaScript development with a lot of great plugins and integrations for web development related tools.
- [Git](https://git-scm.com/) / [GitHub](https://github.com/): Although git != GitHub, version control plays a very important part in modern software development.  GitHub in particular provides a lot of great integrations with tools like [CircleCI](https://circleci.com/) and [GitHub Actions](https://github.com/features/actions) for CI, and [Netlify](https://www.netlify.com/) that can greatly automate a lot of the deployment process like building and deploying your apps.  We plan to provide guides for these in the future, so stay tuned!