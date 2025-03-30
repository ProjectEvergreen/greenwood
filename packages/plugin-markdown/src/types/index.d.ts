import type { ResourcePlugin } from "@greenwood/cli";

type MarkdownPluginOptions = {
  plugins?: string[];
};

export type MarkdownPlugin = (options?: MarkdownPluginOptions) => Array<ResourcePlugin>;

declare module "@greenwood/plugin-markdown" {
  export const greenwoodPluginMarkdown: MarkdownPlugin;
}
