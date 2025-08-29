import { greenwoodPluginMarkdown } from "../../../src/index.js";

export default {
  plugins: [
    greenwoodPluginMarkdown({
      plugins: [
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
