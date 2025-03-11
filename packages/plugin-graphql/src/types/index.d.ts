import type { ResourcePlugin, ServerPlugin } from "@greenwood/cli";
import "../queries/queries.d.ts";
import "../core/client.d.ts";

export type GraphQLPlugin = () => Array<ResourcePlugin, ServerPlugin>;

export type CollectionVariables = {
  name: string;
  orderBy?: number;
};

export type ChildrenVariables = {
  parent?: string;
};

export type Params = {
  query: string;
  variables: CollectionVariables | ChildrenVariables;
};

// this could probably be better fleshed out for all query types...
export type Client = () => {
  query(params: Params);
};

declare module "@greenwood/plugin-graphql" {
  export const greenwoodPluginGraphQL: GraphQLPlugin;
}
