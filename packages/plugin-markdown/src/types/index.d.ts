import type { ResourcePlugin } from "@greenwood/cli";

export type MarkdownPluginItem = string | { name: string; options: object };

export type MarkdownPluginOptions = {
  plugins?: MarkdownPluginItem[];
};

export type MarkdownPlugin = (options?: MarkdownPluginOptions) => Array<ResourcePlugin>;

declare module "@greenwood/plugin-markdown" {
  export const greenwoodPluginMarkdown: MarkdownPlugin;
  export const processMarkdown: (
    contents: string,
    plugins?: MarkdownPluginItem[],
  ) => Promise<string>;
}
