import fs from "node:fs/promises";
import { graphqlServer } from "./core/server.js";
import { mergeImportMap } from "@greenwood/cli/src/lib/node-modules-utils.js";

const importMap = {
  "@greenwood/cli/src/lib/hashing-utils.js":
    "/node_modules/@greenwood/cli/src/lib/hashing-utils.js",
  "@greenwood/plugin-graphql/src/core/client.js":
    "/node_modules/@greenwood/plugin-graphql/src/core/client.js",
  "@greenwood/plugin-graphql/src/core/common.js":
    "/node_modules/@greenwood/plugin-graphql/src/core/common.js",
  "@greenwood/plugin-graphql/src/queries/children.gql":
    "/node_modules/@greenwood/plugin-graphql/src/queries/children.gql",
  "@greenwood/plugin-graphql/src/queries/graph.gql":
    "/node_modules/@greenwood/plugin-graphql/src/queries/graph.gql",
  "@greenwood/plugin-graphql/src/queries/collection.gql":
    "/node_modules/@greenwood/plugin-graphql/src/queries/collection.gql",
};

class GraphQLResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["gql"];
    this.contentType = ["text/javascript", "text/html"];
  }

  async shouldServe(url) {
    return url.protocol === "file:" && this.extensions.indexOf(url.pathname.split(".").pop()) >= 0;
  }

  async serve(url) {
    const js = await fs.readFile(url, "utf-8");
    const body = `
      export default \`${js}\`;
    `;

    return new Response(body, {
      headers: new Headers({
        "Content-Type": this.contentType[0],
      }),
    });
  }

  async shouldIntercept(url, request, response) {
    return response.headers.get("Content-Type")?.indexOf(this.contentType[1]) >= 0;
  }

  async intercept(url, request, response) {
    const body = await response.text();
    const newBody = mergeImportMap(
      body,
      importMap,
      this.compilation?.config?.polyfills?.importMaps,
    );

    return new Response(newBody);
  }

  async shouldOptimize(url, response) {
    return response.headers.get("Content-Type").indexOf(this.contentType[1]) >= 0;
  }

  async optimize(url, response) {
    let body = await response.text();

    body = body.replace(
      "<head>",
      `
      <head>
        <script data-state="apollo" data-gwd-opt="none">
          window.__APOLLO_STATE__ = true;
        </script>
    `,
    );

    return new Response(body);
  }
}

class GraphQLServer {
  constructor(compilation) {
    this.compilation = compilation;
  }

  async start() {
    return (await graphqlServer(this.compilation)).listen().then((server) => {
      console.log(`GraphQLServer started at ${server.url}`);
    });
  }
}

/** @type {import('./types/index.js').GraphQLPlugin} */
const greenwoodPluginGraphQL = () => {
  return [
    {
      type: "server",
      name: "plugin-graphql:server",
      provider: (compilation) => new GraphQLServer(compilation),
    },
    {
      type: "resource",
      name: "plugin-graphql:resource",
      provider: (compilation) => new GraphQLResource(compilation),
    },
  ];
};

export { greenwoodPluginGraphQL };
