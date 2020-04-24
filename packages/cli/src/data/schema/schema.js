const { makeExecutableSchema } = require('apollo-server-express');
const { configTypeDefs, configResolvers } = require('./config');
const { graphTypeDefs, graphResolvers } = require('./graph');
const gql = require('graphql-tag');

module.exports = (graph) => {
  let uniqueCustomDataDefKeys = {};
  let customDataDefs = '';

  graph.forEach((page) => {
    Object.keys(page.data).forEach(key => {
      uniqueCustomDataDefKeys[key] = 'String';
    });
  });

  Object.keys(uniqueCustomDataDefKeys).forEach((key) => {
    customDataDefs += `
      ${key}: ${uniqueCustomDataDefKeys[key]}
    `;
  });

  // use noop as a default key since type Data cannot be empty
  const mergedGraphTypeDefs = gql`
    type Data {
      noop: String
      ${customDataDefs}
    }

    ${graphTypeDefs}
  `;

  const mergedResolvers = Object.assign({}, {
    Query: {
      ...configResolvers.Query,
      ...graphResolvers.Query
    }
  });

  const schema = makeExecutableSchema({
    typeDefs: [
      configTypeDefs,
      mergedGraphTypeDefs
    ],
    resolvers: [
      mergedResolvers
    ]
  });

  return schema;
};