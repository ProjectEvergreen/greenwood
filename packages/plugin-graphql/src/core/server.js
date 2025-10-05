import { ApolloServer } from "@apollo/server";
import { createSchema } from "../schema/schema.js";

const graphqlServer = async (compilation) => {
  const isDev = process.env.__GWD_COMMAND__ === "develop";
  // disable playground for production builds
  const playground = isDev
    ? {
        endpoint: "/graphql",
        settings: {
          "editor.theme": "light",
        },
      }
    : null;
  let serverConfig = {
    schema: await createSchema(compilation),
    introspection: isDev,
  };

  if (playground) {
    serverConfig = {
      ...serverConfig,
      playground,
    };
  }

  const server = new ApolloServer(serverConfig);

  return server;
};

export { graphqlServer };
