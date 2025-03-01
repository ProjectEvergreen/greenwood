import { checkResourceExists } from "@greenwood/cli/src/lib/resource-utils.js";
import { makeExecutableSchema } from "apollo-server-express";
import { graphTypeDefs, graphResolvers } from "./graph.js";
import fs from "fs/promises";
import gql from "graphql-tag";

const createSchema = async (compilation) => {
  const { graph } = compilation;
  const uniqueCustomDataDefKeys = {};
  const customSchemasUrl = new URL("./data/schema/", compilation.context.userWorkspace);
  const customUserResolvers = [];
  const customUserDefs = [];
  let customDataDefsString = "";

  try {
    // define custom data type definitions from user frontmatter
    graph.forEach((page) => {
      Object.keys(page.data).forEach((key) => {
        uniqueCustomDataDefKeys[key] = "String";
      });
    });

    Object.keys(uniqueCustomDataDefKeys).forEach((key) => {
      customDataDefsString += `
        ${key}: ${uniqueCustomDataDefKeys[key]}
      `;
    });

    const customDataDefs = gql`
      type Data {
        noop: String
        ${customDataDefsString}
      }
    `;

    if (await checkResourceExists(customSchemasUrl)) {
      console.log("custom schemas directory detected, scanning...");
      const schemaPaths = (await fs.readdir(customSchemasUrl)).filter(
        (file) => file.split(".").pop() === "js",
      );

      for (const schemaPath of schemaPaths) {
        const { customTypeDefs, customResolvers } = await import(
          // @ts-expect-error see https://github.com/microsoft/TypeScript/issues/42866
          new URL(`./${schemaPath}`, customSchemasUrl)
        );

        customUserDefs.push(customTypeDefs);
        customUserResolvers.push(customResolvers);
      }
    }

    const mergedResolvers = Object.assign(
      {},
      {
        Query: {
          ...graphResolvers.Query,
          ...customUserResolvers.reduce((resolvers, resolver) => {
            return {
              ...resolvers,
              ...resolver.Query,
            };
          }, {}),
        },
      },
    );

    const schema = makeExecutableSchema({
      typeDefs: [graphTypeDefs, customDataDefs, ...customUserDefs],
      resolvers: [mergedResolvers],
    });

    return schema;
  } catch (e) {
    console.error(e);
  }
};

export { createSchema };
