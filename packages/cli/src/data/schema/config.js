const { gql } = require('apollo-server');

const getConfiguration = async (root, query, context) => {
  return context.config;
};

// https://www.greenwoodjs.io/docs/configuration
const configTypeDefs = gql`
  type DevServer {
    port: Int,
    host: String
  }

  type Meta {
    key: String,
    value: String
  }

  type Config {
    devServer: DevServer,
    meta: [Meta]
    publicPath: String,
    title: String,
    workspace: String
  }

  extend type Query {
    config: Config
  }
`;

const configResolvers = {
  Query: {
    config: getConfiguration
  }
};

module.exports = {
  configTypeDefs,
  configResolvers
};