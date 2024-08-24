import { greenwoodPluginGraphQL } from '@greenwood/plugin-graphql';
import { greenwoodPluginIncludeHTML } from '@greenwood/plugin-include-html';
import { greenwoodPluginPolyfills } from '@greenwood/plugin-polyfills';
import { greenwoodPluginPostCss } from '@greenwood/plugin-postcss';
import { greenwoodPluginImportRaw } from '@greenwood/plugin-import-raw';
import { greenwoodPluginRendererPuppeteer } from '@greenwood/plugin-renderer-puppeteer';
import rollupPluginAnalyzer from 'rollup-plugin-analyzer';

export default {
  workspace: new URL('./www/', import.meta.url),
  optimization: 'inline',
  staticRouter: true,
  interpolateFrontmatter: true,
  polyfills: {
    // importMaps: true,
    importAttributes: ['css', 'json']
  },
  plugins: [
    greenwoodPluginGraphQL(),
    greenwoodPluginPolyfills({
      lit: true
    }),
    greenwoodPluginPostCss(),
    greenwoodPluginImportRaw({
      matches: [
        'eve-button.css',
        'eve-container.css'
      ]
    }),
    greenwoodPluginIncludeHTML(),
    greenwoodPluginRendererPuppeteer(),
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
    }
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