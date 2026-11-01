import { greenwoodPluginGraphQL } from "@greenwood/plugin-graphql";
import { greenwoodPluginIncludeHTML } from "@greenwood/plugin-include-html";
import { greenwoodPluginPolyfills } from "@greenwood/plugin-polyfills";
import { greenwoodPluginPostCss } from "@greenwood/plugin-postcss";
import { greenwoodPluginImportText } from "@greenwood/plugin-import-text";
import { greenwoodPluginRendererPuppeteer } from "@greenwood/plugin-renderer-puppeteer";
import { greenwoodPluginMarkdown } from "@greenwood/plugin-markdown";
import rollupPluginAnalyzer from "rollup-plugin-analyzer";

/** @type {import('@greenwood/cli').Config} */
export default {
  optimization: "inline",
  staticRouter: true,
  activeContent: true,
  prerender: true,
  concurrency: 1,
  plugins: [
    greenwoodPluginMarkdown({
      plugins: ["@mapbox/rehype-prism", "rehype-slug", "rehype-autolink-headings", "remark-github"],
    }),
    greenwoodPluginGraphQL(),
    greenwoodPluginPolyfills({
      lit: true,
    }),
    greenwoodPluginPostCss(),
    greenwoodPluginImportText({
      matches: ["eve-button.css", "eve-container.css"],
    }),
    greenwoodPluginIncludeHTML(),
    greenwoodPluginRendererPuppeteer(),
    {
      type: "rollup",
      name: "rollup-plugin-analyzer",
      provider: () => {
        return [
          rollupPluginAnalyzer({
            summaryOnly: true,
            filter: (module) => {
              return !module.id.endsWith(".html");
            },
          }),
        ];
      },
    },
  ],
};
