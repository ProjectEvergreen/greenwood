const { makeExecutableSchema } = require('apollo-server-express');
const { configTypeDefs, configResolvers } = require('./config');
const { graphTypeDefs, graphResolvers } = require('./graph');
const fs = require('fs');
const gql = require('graphql-tag');
const path = require('path');

module.exports = (compilation) => {
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
      fs.readdirSync(customSchemasPath)
        .filter(file => path.extname(file) === '.js')
        .forEach(file => {
          const { customTypeDefs, customResolvers } = require(`${customSchemasPath}/${file}`);
          customUserDefs.push(customTypeDefs);
          customUserResolvers.push(customResolvers);
        });
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