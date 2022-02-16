import gql from 'graphql-tag';

const getConfiguration = async (root, query, context) => {
  return context.config;
};

// https://www.greenwoodjs.io/docs/configuration
const configTypeDefs = gql`
  type DevServer {
    port: Int
  }

  type Config {
    devServer: DevServer,
    staticRouter: Boolean,
    optimization: String,
    prerender: Boolean,
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

export {
  configTypeDefs,
  configResolvers
};