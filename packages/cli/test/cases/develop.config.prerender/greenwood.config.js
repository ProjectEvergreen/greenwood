export default {
  prerender: true,
  activeContent: true,
  basePath: "/demo",
  devServer: { port: 21984 },
  polyfills: { importMaps: true },
  plugins: [
    {
      type: "resource",
      name: "test-intercepted-content",
      provider: () => ({
        shouldIntercept: async (url, request, response) =>
          url.pathname === "/demo/" && response.headers.get("Content-Type")?.includes("text/html"),
        intercept: async (url, request, response) =>
          new Response(
            (await response.text()).replace(
              "<body>",
              '<body><app-badge class="from-interceptor"></app-badge>',
            ),
          ),
      }),
    },
  ],
};
