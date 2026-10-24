import { greenwoodPluginMarkdown } from "../../../src/index.js";

export default {
  plugins: [
    greenwoodPluginMarkdown({
      plugins: [
        "my-markdown-project/my-custom-rehype-plugin",
        "@mapbox/rehype-prism",
        "rehype-slug",
        {
          name: "rehype-autolink-headings",
          options: { behavior: "append" },
        },
      ],
    }),
  ],
};
