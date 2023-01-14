import { makeExecutableSchema } from 'apollo-server-express';
import { configTypeDefs, configResolvers } from './config.js';
import { graphTypeDefs, graphResolvers } from './graph.js';
import fs from 'fs';
import gql from 'graphql-tag';

const createSchema = async (compilation) => {
  const { graph } = compilation;
  const uniqueCustomDataDefKeys = {};
  const customSchemasUrl = new URL('./data/schema/', compilation.context.userWorkspace);
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

    if (fs.existsSync(customSchemasUrl.pathname)) {
      console.log('custom schemas directory detected, scanning...');
      const schemaPaths = (await fs.promises.readdir(customSchemasUrl))
        .filter(file => file.split('.').pop() === 'js');

      for (const schemaPath of schemaPaths) {
        const { customTypeDefs, customResolvers } = await import(new URL(`./${schemaPath}`, customSchemasUrl));
        
        customUserDefs.push(customTypeDefs);
        customUserResolvers.push(customResolvers);
      }
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