const path = require('path');
const pluginGoogleAnalytics = require('./packages/plugin-google-analytics/src/index');
const pluginPolyfills = require('./packages/plugin-polyfills/src/index');

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
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 30000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 6,
      maxInitialRequests: 4,
      automaticNameDelimiter: '~',
      automaticNameMaxLength: 30,
      cacheGroups: {
        about: {
          test(module, chunks) {
            const regexp = /about/i;
            const result = `${module.name || ''}`.match(regexp) || chunks.some(chunk => `${chunk.name || ''}`.match(regexp));

            return result;
          },
          name: 'about',
          chunks: 'all'
        },
        docs: {
          test(module, chunks) {
            const regexp = /docs/i;
            const result = `${module.name || ''}`.match(regexp) || chunks.some(chunk => `${chunk.name || ''}`.match(regexp));

            return result;
          },
          name: 'docs',
          chunks: 'all'
        },
        gettingStarted: {
          test(module, chunks) {
            const regexp = /getting-started/i;
            const result = `${module.name || ''}`.match(regexp) || chunks.some(chunk => `${chunk.name || ''}`.match(regexp));

            return result;
          },
          name: 'getting-started',
          chunks: 'all'
        },
        plugins: {
          test(module, chunks) {
            const regexp = /plugins/i;
            const result = `${module.name || ''}`.match(regexp) || chunks.some(chunk => `${chunk.name || ''}`.match(regexp));

            return result;
          },
          name: 'plugins',
          chunks: 'all'
        }
      }
    }
  },

  plugins: [
    ...pluginGoogleAnalytics({
      analyticsId: 'UA-147204327-1'
    }),

    ...pluginPolyfills()
  ]
};