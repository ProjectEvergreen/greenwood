import type { ResourcePlugin } from "@greenwood/cli";

type MarkdownPluginOptions = {
  plugins?: Array<string | { name: string; options: object }>;
};

export type MarkdownPlugin = (options?: MarkdownPluginOptions) => Array<ResourcePlugin>;

declare module "@greenwood/plugin-markdown" {
  export const greenwoodPluginMarkdown: MarkdownPlugin;
}
