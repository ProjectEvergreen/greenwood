import type { Config } from "@greenwood/cli";
import { greenwoodPluginAdapterAws } from "@greenwood/plugin-adapter-aws";
import { greenwoodPluginAdapterVercel } from "@greenwood/plugin-adapter-vercel";
import { greenwoodPluginAdapterNetlify } from "@greenwood/plugin-adapter-netlify";
import { greenwoodPluginBabel } from "@greenwood/plugin-babel";
import { greenwoodPluginCssModules } from "@greenwood/plugin-css-modules";
import { greenwoodPluginGoogleAnalytics } from "@greenwood/plugin-google-analytics";
import { greenwoodPluginGraphQL } from "@greenwood/plugin-graphql";
import { greenwoodPluginImportCommonJs } from "@greenwood/plugin-import-commonjs";
import { greenwoodPluginImportJsx } from "@greenwood/plugin-import-jsx";
import { greenwoodPluginImportRaw } from "@greenwood/plugin-import-raw";
import { greenwoodPluginIncludeHTML } from "@greenwood/plugin-include-html";
import { greenwoodPluginPolyfills } from "@greenwood/plugin-polyfills";
import { greenwoodPluginPostCss } from "@greenwood/plugin-postcss";
import { greenwoodPluginRendererLit } from "@greenwood/plugin-renderer-lit";
import { greenwoodPluginRendererPuppeteer } from "@greenwood/plugin-renderer-puppeteer";

const port: number = 8080;

const config: Config = {
  activeContent: true,
  basePath: "/foo",
  devServer: {
    extensions: ["txt"],
    hud: true,
    port,
    proxy: {
      "/api": "https://www.example.com",
    },
  },
  isolation: true,
  layoutsDirectory: "/my-layouts",
  optimization: "default",
  markdown: {
    plugins: ["@mapbox/rehype-prism"],
  },
  pagesDirectory: "/my-pages",
  plugins: [
    greenwoodPluginAdapterAws(),
    greenwoodPluginAdapterNetlify(),
    greenwoodPluginAdapterVercel({ runtime: "nodejs18.x" }),
    greenwoodPluginBabel(),
    greenwoodPluginCssModules(),
    greenwoodPluginGoogleAnalytics({ analyticsId: "XXX-123456" }),
    greenwoodPluginGraphQL(),
    greenwoodPluginImportCommonJs(),
    greenwoodPluginImportJsx(),
    greenwoodPluginImportRaw,
    greenwoodPluginIncludeHTML(),
    greenwoodPluginPolyfills(),
    greenwoodPluginPostCss(),
    greenwoodPluginRendererLit(),
    greenwoodPluginRendererPuppeteer(),
  ],
  polyfills: {
    importAttributes: ["css", "json"],
    importMaps: false,
  },
  port,
  prerender: true,
  staticRouter: true,
  useTsc: true,
  workspace: import.meta.url,
};

export default config;
