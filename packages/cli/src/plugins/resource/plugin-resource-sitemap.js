import { checkResourceExists } from "../../lib/resource-utils.js";

class SitemapResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.contentType = "text/xml";
  }

  async shouldServe(url) {
    const { userWorkspace } = this.compilation.context;

    return (
      url.pathname === "/sitemap.xml" &&
      (await checkResourceExists(new URL("./sitemap.xml.js", userWorkspace)))
    );
  }

  async serve() {
    const { userWorkspace } = this.compilation.context;
    // generate a dynamic sitemap from the user's sitemap.xml.js module
    // https://github.com/ProjectEvergreen/greenwood/issues/1232
    const { generateSitemap } = await import(new URL("./sitemap.xml.js", userWorkspace).href);
    const body = await generateSitemap(this.compilation);

    return new Response(body, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }
}

const greenwoodPluginResourceSitemap = {
  type: "resource",
  name: "plugin-resource-sitemap",
  provider: (compilation) => new SitemapResource(compilation),
};

export { greenwoodPluginResourceSitemap };
