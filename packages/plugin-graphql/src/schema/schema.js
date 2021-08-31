import { makeExecutableSchema } from 'apollo-server-express';
import { configTypeDefs, configResolvers } from './config.js';
import { graphTypeDefs, graphResolvers } from './graph.js';
import fs from 'fs';
import gql from 'graphql-tag';
import path from 'path';

const createSchema = async (compilation) => {
  const { graph } = compilation;
  const uniqueCustomDataDefKeys = {};
  const customSchemasPath = `${compilation.context.userWorkspace}/data/schema`;
  const customUserResolvers = [];
  const customUserDefs = [];
  let customDataDefsString = '';

  try {

    // define custom data type definitions from user frontmatter
    graph.forEach((page) => {
      Object.keys(page.data).forEach(key => {
        uniqueCustomDataDefKeys[key] = 'String';
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

    if (fs.existsSync(customSchemasPath)) {
      console.log('custom schemas directory detected, scanning...');
      const schemaPaths = (await fs.promises.readdir(customSchemasPath))
        .filter(file => path.extname(file) === '.js');

      for(const schemaPath in schemaPaths) {
        const { customTypeDefs, customResolvers } = await import(`${customSchemasPath}/${schemaPath}`);
        customUserDefs.push(customTypeDefs);
        customUserResolvers.push(customResolvers);
      };
    }
  
    const mergedResolvers = Object.assign({}, {
      Query: {
        ...graphResolvers.Query,
        ...configResolvers.Query,
        ...customUserResolvers.reduce((resolvers, resolver) => {
          return {
            ...resolvers,
            ...resolver.Query
          };
        }, {})
      }
    });
  
    const schema = makeExecutableSchema({
      typeDefs: [
        graphTypeDefs,
        configTypeDefs,
        customDataDefs,
        ...customUserDefs
      ],
      resolvers: [
        mergedResolvers
      ]
    });
  
    return schema;
  } catch (e) {
    console.error(e);
  }
};

export { createSchema };