const gql = require('graphql-tag');

const getConfiguration = async (root, query, context) => {
  return context.config;
};

// https://www.greenwoodjs.io/docs/configuration
const configTypeDefs = gql`
  type DevServer {
    port: Int
  }

  type Meta {
    name: String,
    value: String,
    content: String,
    rel: String,
    property: String,
    href: String
  }

  type Config {
    devServer: DevServer,
    meta: [Meta],
    mode: String,
    optimization: String,
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