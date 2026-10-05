import fs from "node:fs/promises";
import { graphqlServer } from "./core/server.js";
import { getAvailablePort } from "@greenwood/cli/src/lib/server-utils.js";
import { mergeImportMap } from "@greenwood/cli/src/lib/node-modules-utils.js";
import { startStandaloneServer } from "@apollo/server/standalone";
import { createCache } from "./core/cache.js";

const DEFAULT_PORT = 4000;
const serverState = {
  port: DEFAULT_PORT,
};
const getPortScript = (port) => {
  return `<script data-gwd-opt="none" data-graphql-port>
          globalThis.__GWD_GRAPHQL_PORT__ = ${port};
        </script>`;
};

const importMap = {
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
    let newBody = mergeImportMap(body, importMap, this.compilation?.config?.polyfills?.importMaps);

    newBody = newBody.replace(
      "<head>",
      `<head>
        ${getPortScript(serverState.port)}`,
    );

    return new Response(newBody);
  }

  async shouldOptimize(url, response) {
    return response.headers.get("Content-Type").indexOf(this.contentType[1]) >= 0;
  }

  async optimize(url, response) {
    let body = await response.text();

    body = body.replace(getPortScript(serverState.port), "");
    body = body.replace(
      "<head>",
      `
      <head>
        <script data-state="apollo" data-gwd-opt="none">
          globalThis.__APOLLO_STATE__ = true;
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
    const port = await getAvailablePort(DEFAULT_PORT);

    if (port !== DEFAULT_PORT) {
      console.warn(
        `GraphQL port ${DEFAULT_PORT} is already in use, using next available port of ${port} instead.`,
      );
    }

    // https://www.apollographql.com/docs/apollo-server/api/standalone
    const { url } = await startStandaloneServer(await graphqlServer(this.compilation), {
      listen: { port },
      context: async (integrationContext) => {
        const { req } = integrationContext;
        const { config, graph, context } = this.compilation;

        // make sure to ignore introspection requests from being generated as an output cache file
        // https://stackoverflow.com/a/58040379/417806
        if (
          process.env.__GWD_COMMAND__ === "build" &&
          !req?.url.endsWith("?q=internal") &&
          req?.body?.operationName !== "IntrospectionQuery"
        ) {
          await createCache(req, context, port);
        }

        return {
          config,
          graph,
        };
      },
    });

    serverState.port = port;
    globalThis.__GWD_GRAPHQL_PORT__ = port;
    // worker threads inherit the environment when they are created.
    process.env.__GWD_GRAPHQL_PORT__ = String(port);

    console.log(`GraphQLServer started at ${url}`);
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
