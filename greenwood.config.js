import fetch from 'node-fetch';
import { greenwoodPluginGraphQL } from '@greenwood/plugin-graphql';
import { greenwoodPluginIncludeHTML } from '@greenwood/plugin-include-html';
import { greenwoodPluginImportCss } from '@greenwood/plugin-import-css';
import { greenwoodPluginImportJson } from '@greenwood/plugin-import-json';
import { greenwoodPluginPolyfills } from '@greenwood/plugin-polyfills';
import { greenwoodPluginPostCss } from '@greenwood/plugin-postcss';
import rollupPluginAnalyzer from 'rollup-plugin-analyzer';
import { fileURLToPath, URL } from 'url';

const META_DESCRIPTION = 'A modern and performant static site generator supporting Web Component based development';
const FAVICON_HREF = '/assets/favicon.ico';

// this could just as easily come from an API, DB, Headless CMS, etc
const customExternalSourcesPlugin = {
  type: 'source',
  name: 'source-plugin-analogstudios',
  provider: () => {
    return async function () {
      const artists = await fetch('http://www.analogstudios.net/api/artists').then(resp => resp.json());

      return artists.map((artist) => {
        const { bio, id, imageUrl, name } = artist;
        const route = `/artists/${name.toLowerCase().replace(/ /g, '-')}/`;

        return {
          title: name,
          body: `
            <p>${bio}</p>
            <img src='${imageUrl}'/>
          `,
          route,
          id,
          label: name,
          data: {
            imageUrl
          }
        };
      });
    };
  }
};

export default {
  workspace: fileURLToPath(new URL('./www', import.meta.url)),
  mode: 'mpa',
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
    ...greenwoodPluginGraphQL(),
    ...greenwoodPluginPolyfills(),
    greenwoodPluginPostCss(),
    ...greenwoodPluginImportJson(),
    ...greenwoodPluginImportCss(),
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
    ...greenwoodPluginIncludeHTML(),
    customExternalSourcesPlugin
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