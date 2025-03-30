export default {
  markdown: {
    plugins: [
      "@mapbox/rehype-prism",
      "rehype-slug",
      {
        name: "rehype-autolink-headings",
        options: { behavior: "append" },
      },
    ],
  },
};
