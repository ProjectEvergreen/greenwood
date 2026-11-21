import fs from "node:fs/promises";

class BinaryResource {
  constructor() {
    this.extensions = ["wasm"];
  }

  async shouldServe(url) {
    return url.pathname.endsWith(".wasm");
  }

  async serve(url) {
    return new Response(await fs.readFile(url), {
      headers: {
        "Content-Type": "application/wasm",
      },
    });
  }
}

export default {
  plugins: [
    {
      type: "resource",
      name: "plugin-binary",
      provider: () => new BinaryResource(),
    },
  ],
};
