import type { Config } from "./config.d.ts";
import type { Page } from "./content.d.ts";

// https://greenwoodjs.dev/docs/reference/appendix/#compilation
export type Compilation = {
  context: {
    dataDir: URL,
    outputDir: URL,
    userWorkspace: URL,
    apisDir: URL,
    pagesDir: URL,
    userLayoutsDir: URL,
    scratchDir: URL,
    projectDirectory: URL,
    layoutsDir: URL
  },
  graph: Page[],
  config: Config
}