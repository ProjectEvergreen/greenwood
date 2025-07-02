import fs from "node:fs/promises";

class FooResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;
    this.servePage = options.servePage;

    this.extensions = ["foo"];
    this.contentType = "text/html";
  }

  async shouldServe(url) {
    return url.pathname.split(".").pop() === this.extensions[0] && this.servePage;
  }

  async serve(url) {
    const body = await fs.readFile(url, "utf-8");

    return new Response(body, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }
}

class BarResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;
    this.servePage = options.servePage;

    this.extensions = ["bar"];
    this.contentType = "text/javascript";
  }

  async shouldServe(url) {
    return url.pathname.split(".").pop() === this.extensions[0] && this.servePage;
  }

  async serve(url) {
    let body = await fs.readFile(url, "utf-8");

    body = body.replace(/interface (.*){(.*)}/, "");

    return new Response(body, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }
}

const greenwoodPluginFooResource = (options = {}) => {
  return [
    {
      type: "resource",
      name: "plugin-import-foo:resource",
      provider: (compilation) => new FooResource(compilation, options),
    },
  ];
};

const greenwoodPluginBarResource = (options = {}) => {
  return [
    {
      type: "resource",
      name: "plugin-import-bar:resource",
      provider: (compilation) => new BarResource(compilation, options),
    },
  ];
};

export default {
  plugins: [
    greenwoodPluginFooResource({
      servePage: "static",
    }),
    greenwoodPluginBarResource({
      servePage: "dynamic",
    }),
  ],
};
