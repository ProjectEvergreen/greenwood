import { getPackageRoot } from "@greenwood/cli/src/lib/node-modules-utils.js";
import { fileUrlToResolvedPrefixPath } from "@greenwood/cli/src/lib/resource-utils.js";

const webComponentsBundleUrl = fileUrlToResolvedPrefixPath(
  new URL(
    "./webcomponents-bundle.js",
    getPackageRoot("@webcomponents/webcomponentsjs", import.meta.url),
  ),
);

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
        <script src="${webComponentsBundleUrl}"></script>
    `,
    );

    return new Response(body);
  }
}

export { PuppeteerResource };
