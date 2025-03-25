export default {
  activeContent: true,
  prerender: true,
  plugins: [
    {
      name: "External Content Plugin",
      type: "source",
      provider: () => {
        return async function () {
          return [
            {
              id: "external",
              route: "/external/",
              title: "External Page",
              label: "External Page",
              body: "<h1>External Page</h1>",
              collection: "nav",
              data: {
                order: 4,
              },
            },
          ];
        };
      },
    },
  ],
};
