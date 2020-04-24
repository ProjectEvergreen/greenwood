---
label: 'next'
menu: side
title: 'Next Steps'
index: 7
---

## Next Steps

## About Greenwood
Thank you so much for taking the time to go through our Getting Started guide and we hope it has given you a good overview of how to work with Greenwood and what some of the possibilities are.  To learn more about the project we encourage you to review our [API docs](/docs/) to learn more about how you can use Greenwood or check out our repo to see what we're [working on next](https://github.com/ProjectEvergreen/greenwood/projects), or if you need to reach out, feel free to [open an issue](https://github.com/ProjectEvergreen/greenwood/issues)!

## Configuration
Although configuration is a topic all on its own, we do want to walk through setting up a configuration file for your project.  As you may have noticed, the `<title>` of the site being made during the Getting Started section said _Greenwood App_.  This is what Greenwood's configuration can be used for.

To change the title of the project (like in the companion repo), create a (NodeJS) module called _greenwood.config.js_ at the root of your project and configure the `export` object with a title property.

```render javascript
module.exports = {
  title: 'My Personal Site'
};
```

That's it!  You can learn more about configuring Greenwood [here](/docs/configuration).

## Companion Repo
You may have noticed that the Getting Started [companion repo](https://github.com/ProjectEvergreen/greenwood-getting-started/) itself is a bit more of a full fledged example then captured in this guide, like with the use use of ["Single File Components"](https://vuejs.org/v2/guide/single-file-components.html) (SFCs).

This is was intentional for a couple of reasons:
- _Education_: There is always more than one way to solve a problem, and so we felt that the SFC approach was best for the guide so as to keep the number of steps needed as few and direct as possible.
- _Development_: The other side of the coin is that for us having the CSS in an external file helps with development and maintenance.  _This is just a preference_.  Please choose what fits your workflow best.
- _Maintenance_: We want to keep a loose coupling between the guide and the repository to avoid additional overhead maintaining the two and keeping them in sync.  The goal of this guide is to focus on the overall experience of creating your first Greenwood project, not worrying about theming or project structure, since Greenwood generally supports just about any folder organization you could want and has no opinions on styles.

## Resources
Since Greenwood aims to be a web "first" tool, all the great web development resources for the web already apply to Greenwood!  Below are some resources that we think might be useful as part of a broader understanding of the topic of web development and that we have found invalualable for our own development and learning.
- [MDN](https://developer.mozilla.org/) - Mozilla Developer Network has some of the best technical and sample content available for learning about all the features and capabilities of the web.
- [Web Components](https://www.webcomponents.org/introduction) - A brief introduction to the specs that make up Web Components.
- [CSS / Shadow DOM](https://developers.google.com/web/fundamentals/web-components/shadowdom)
- [CanIUse.com](https://caniuse.com/) - Find out what browser support various JS and CSS features have.
- [LitElement](https://lit-element.polymer-project.org/) / [LitHtml](https://lit-html.polymer-project.org/) - Helper libraries for working with Web Components that are available with Greenwood.
- [VSCode](https://code.visualstudio.com/) - A very popular IDE for JavaScript development with a lot of great plugins and integrations for web development related tools.
- [Git](https://git-scm.com/) / [GitHub](https://github.com/): Although git != GitHub, version control plays a very important part in modern software development.  GitHub in particular provides a lot of great integrations with tools like [CircleCI](https://circleci.com/) and [GitHub Actions](https://github.com/features/actions) for CI, and [Netlify](https://www.netlify.com/) that can greatly automate a lot of the deployment process like building and deploying your apps.  We plan to provide guides for these in the future, so stay tuned!
