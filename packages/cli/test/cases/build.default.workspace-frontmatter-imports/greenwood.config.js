import fs from "node:fs/promises";

class NaiveFooResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;

    this.extensions = ["foo"];
    this.contentType = "text/javascript";
  }

  async shouldServe(url, request) {
    return (
      url.pathname.split(".").pop() === this.extensions[0] &&
      request.headers?.get("Accept").indexOf(this.contentType) >= 0
    );
  }

  async serve(url) {
    let body = await fs.readFile(url, "utf-8");

    body = body.replace(": string", "");

    return new Response(body, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }
}

class NaiveSassResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;

    this.extensions = ["scss"];
    this.contentType = "text/css";
  }

  async shouldServe(url, request) {
    return (
      url.pathname.split(".").pop() === this.extensions[0] &&
      request.headers?.get("Accept").indexOf(this.contentType) >= 0
    );
  }

  async serve(url) {
    let body = await fs.readFile(url, "utf-8");

    body = body.replace(/\$my-color: red;/, "");
    body = body.replace(/\$my-color/, "'red'");

    return new Response(body, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }
}

export default {
  prerender: true,
  plugins: [
    {
      type: "resource",
      name: "plugin-naive-foo",
      provider: (compilation) => new NaiveFooResource(compilation),
    },
    {
      type: "resource",
      name: "plugin-naive-sass",
      provider: (compilation) => new NaiveSassResource(compilation),
    },
  ],
};
