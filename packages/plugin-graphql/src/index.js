import fs from "node:fs/promises";
import http from "node:http";
import express from "express";
import cors from "cors";
import { expressMiddleware } from "@as-integrations/express5";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { graphqlServer } from "./core/server.js";
import { listenOnAvailablePort } from "@greenwood/cli/src/lib/server-utils.js";
import { mergeImportMap } from "@greenwood/cli/src/lib/node-modules-utils.js";
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
    const app = express();
    const httpServer = http.createServer(app);
    const apolloServer = await graphqlServer(this.compilation);
    let port;

    apolloServer.addPlugin(ApolloServerPluginDrainHttpServer({ httpServer }));
    await apolloServer.start();

    // Own the HTTP listener so concurrent servers select and bind a port in one
    // operation, rather than releasing a probe before Apollo attempts to bind it.
    // https://www.apollographql.com/docs/apollo-server/api/express-middleware
    app.disable("x-powered-by");
    app.use(
      cors(),
      express.json({ limit: "50mb" }),
      expressMiddleware(apolloServer, {
        context: async ({ req }) => {
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
      }),
    );

    try {
      port = await listenOnAvailablePort(httpServer, DEFAULT_PORT);
    } catch (error) {
      await apolloServer.stop();
      throw error;
    }

    if (port !== DEFAULT_PORT) {
      console.warn(
        `GraphQL port ${DEFAULT_PORT} is already in use, using next available port of ${port} instead.`,
      );
    }

    serverState.port = port;
    globalThis.__GWD_GRAPHQL_PORT__ = port;
    // worker threads inherit the environment when they are created.
    process.env.__GWD_GRAPHQL_PORT__ = String(port);

    console.log(`GraphQLServer started at http://localhost:${port}/`);
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
