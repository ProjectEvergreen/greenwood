import type { Config } from "./config.d.ts";
import type { Page, Graph } from "./content.d.ts";

// https://greenwoodjs.dev/docs/reference/appendix/#compilation
export type Compilation = {
  context: {
    dataDir: URL;
    outputDir: URL;
    userWorkspace: URL;
    apisDir: URL;
    pagesDir: URL;
    scratchDir: URL;
    projectDirectory: URL;
    layoutsDir: URL;
  };
  graph: Graph;
  config: Config;
};

export type Frontmatter = {
  collection?: string | string[];
  label?: string;
  layout?: string;
  title?: string;
  imports?: string[];
  data?: {
    [key: string]: string;
  };
};
