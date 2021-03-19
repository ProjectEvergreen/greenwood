const path = require('path');
const pluginGoogleAnalytics = require('./packages/plugin-google-analytics/src/index');
const pluginGraphQL = require('./packages/plugin-graphql/src/index');
const pluginImportCss = require('./packages/plugin-import-css/src/index');
const pluginPolyfills = require('./packages/plugin-polyfills/src/index');
const pluginPostCss = require('./packages/plugin-postcss/src/index');

const META_DESCRIPTION = 'A modern and performant static site generator supporting Web Component based development';
const FAVICON_HREF = '/assets/favicon.ico';

module.exports = {
  workspace: path.join(__dirname, 'www'),
  title: 'Greenwood',
  meta: [
    { name: 'description', content: META_DESCRIPTION },
    { name: 'twitter:site', content: '@PrjEvergreen' },
    { property: 'og:title', content: 'Greenwood' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://www.greenwoodjs.io' },
    { property: 'og:image', content: 'https://s3.amazonaws.com/hosted.greenwoodjs.io/greenwood-logo.png' },
    { property: 'og:description', content: META_DESCRIPTION },
    { rel: 'shortcut icon', href: FAVICON_HREF },
    { rel: 'icon', href: FAVICON_HREF },
    { name: 'google-site-verification', content: '4rYd8k5aFD0jDnN0CCFgUXNe4eakLP4NnA18mNnK5P0' }
  ],
  plugins: [
    pluginGoogleAnalytics({
      analyticsId: 'UA-147204327-1'
    }),
    ...pluginGraphQL(),
    pluginPolyfills(),
    pluginPostCss(),
    ...pluginImportCss()
  ],
  markdown: {
    plugins: [
      '@mapbox/rehype-prism',
      'rehype-slug',
      'rehype-autolink-headings',
      'remark-github'
    ]
  }
};