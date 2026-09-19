import { greenwoodPluginRss } from "../../../src/index.js";

export default {
  plugins: [
    greenwoodPluginRss({
      title: "My Blog",
      link: "https://www.myblog.dev",
      description: "Musings on web development",
    }),
  ],
};
