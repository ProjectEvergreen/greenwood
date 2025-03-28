class PuppeteerResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;
    this.extensions = [".html"];
    this.contentType = "text/html";
  }

  async shouldIntercept(url, request, response) {
    const { protocol } = url;

    return (
      process.env.__GWD_COMMAND__ === "build" &&
      protocol.startsWith("http") &&
      response.headers.get("Content-Type")?.indexOf(this.contentType) >= 0
    );
  }

  async intercept(url, request, response) {
    let body = await response.text();

    body = body.replace(
      "<head>",
      `
      <head>
        <script src="/node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js"></script>
    `,
    );

    return new Response(body);
  }
}

export { PuppeteerResource };
