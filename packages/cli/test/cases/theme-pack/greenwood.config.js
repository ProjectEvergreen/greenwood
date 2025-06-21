import fs from "node:fs/promises";
import { myThemePack } from "./my-theme-pack.js";

const packageName = JSON.parse(
  await fs.readFile(new URL("./package.json", import.meta.url), "utf-8"),
).name;

class MyThemePackDevelopmentResource {
  constructor(compilation) {
    this.compilation = compilation;
  }

  async shouldResolve(url) {
    return (
      process.env.__GWD_COMMAND__ === "develop" &&
      url.pathname.startsWith(`/node_modules/${packageName}/`)
    );
  }

  async resolve(url) {
    const themePackUrl = url.pathname.replace(`/node_modules/${packageName}/dist`, "src");

    return new Request(`${this.compilation.context.projectDirectory}${themePackUrl}`);
  }
}

export default {
  plugins: [
    ...myThemePack({
      __isDevelopment: true,
    }),
    {
      type: "resource",
      name: `${packageName}:resource`,
      provider: (compilation) => new MyThemePackDevelopmentResource(compilation),
    },
  ],
};
