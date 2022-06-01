import { greenwoodPluginGraphQL } from '@greenwood/plugin-graphql';
import { greenwoodPluginIncludeHTML } from '@greenwood/plugin-include-html';
import { greenwoodPluginImportCss } from '@greenwood/plugin-import-css';
import { greenwoodPluginImportJson } from '@greenwood/plugin-import-json';
import { greenwoodPluginPolyfills } from '@greenwood/plugin-polyfills';
import { greenwoodPluginPostCss } from '@greenwood/plugin-postcss';
import rollupPluginAnalyzer from 'rollup-plugin-analyzer';
import { fileURLToPath, URL } from 'url';

export default {
  workspace: fileURLToPath(new URL('./www', import.meta.url)),
  prerender: true,
  optimization: 'inline',
  // staticRouter: true,
  interpolateFrontmatter: true,
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