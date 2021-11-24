const path = require('path');
const pluginGraphQL = require('@greenwood/plugin-graphql');
const pluginIncludeHtml = require('@greenwood/plugin-include-html');
const pluginImportCss = require('@greenwood/plugin-import-css');
const pluginImportJson = require('@greenwood/plugin-import-json');
const pluginPolyfills = require('@greenwood/plugin-polyfills');
const pluginPostCss = require('@greenwood/plugin-postcss');
const rollupPluginAnalyzer = require('rollup-plugin-analyzer');

const META_DESCRIPTION = 'A modern and performant static site generator supporting Web Component based development';
const FAVICON_HREF = '/assets/favicon.ico';

module.exports = {
  workspace: path.join(__dirname, 'www'),
  mode: 'ssr',
  prerender: false,
  optimization: 'inline',
  title: 'Greenwood',
  meta: [
    { name: 'description', content: META_DESCRIPTION },
    { name: 'twitter:site', content: '@PrjEvergreen' },
    { property: 'og:title', content: 'Greenwood' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://www.greenwoodjs.io' },
    { property: 'og:image', content: 'https://www.greenwoodjs.io/assets/greenwood-logo-300w.png' },
    { property: 'og:description', content: META_DESCRIPTION },
    { rel: 'shortcut icon', href: FAVICON_HREF },
    { rel: 'icon', href: FAVICON_HREF },
    { name: 'google-site-verification', content: '4rYd8k5aFD0jDnN0CCFgUXNe4eakLP4NnA18mNnK5P0' }
  ],
  plugins: [
    ...pluginGraphQL(),
    ...pluginPolyfills(),
    pluginPostCss(),
    ...pluginImportJson(),
    ...pluginImportCss(),
    {
      type: 'rollup',
      name: 'rollup-plugin-analyzer',
      provider: () => {
        return [
          rollupPluginAnalyzer({
            summaryOnly: true,
            filter: (module) => {
              return !module.id.endsWith('.html');
            }
          })
        ];
      }
    },
    ...pluginIncludeHtml()
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