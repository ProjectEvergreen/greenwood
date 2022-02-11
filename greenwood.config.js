import { greenwoodPluginGraphQL } from '@greenwood/plugin-graphql';
import { greenwoodPluginIncludeHTML } from '@greenwood/plugin-include-html';
import { greenwoodPluginImportCss } from '@greenwood/plugin-import-css';
import { greenwoodPluginImportJson } from '@greenwood/plugin-import-json';
import { greenwoodPluginPolyfills } from '@greenwood/plugin-polyfills';
import { greenwoodPluginPostCss } from '@greenwood/plugin-postcss';
import rollupPluginAnalyzer from 'rollup-plugin-analyzer';
import { fileURLToPath, URL } from 'url';

const META_DESCRIPTION = 'A modern framework focused on web standards to help you build your next project.';
const FAVICON_HREF = '/favicon.ico';

export default {
  workspace: fileURLToPath(new URL('./www', import.meta.url)),
  optimization: 'inline',
  staticRouter: true,
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
    { rel: 'icon', href: FAVICON_HREF }
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
    ...greenwoodPluginIncludeHTML()
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