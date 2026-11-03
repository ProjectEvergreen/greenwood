const fragment = `<!doctype html>
  <html>
    <head><script type="module" src="/components/header.js" data-gwd-opt="static"></script></head>
    <body><app-header></app-header></body>
  </html>`;

export default {
  prerender: true,
  plugins: [
    {
      type: "resource",
      name: "test-html-response",
      provider: () => ({
        shouldServe: async (url) =>
          ["/api/fragment", "/created/"].includes(url.pathname) ||
          url.pathname.endsWith("/assets/fragment.html"),
        serve: async (url) =>
          new Response(fragment, {
            status: url.pathname === "/created/" ? 201 : 200,
            statusText: url.pathname === "/created/" ? "Created" : "OK",
            headers: { "Content-Type": "text/html", "X-Custom-Header": "preserved" },
          }),
      }),
    },
  ],
};
