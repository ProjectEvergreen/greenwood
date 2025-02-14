import type { Plugin } from "@greenwood/cli/src/types/index.d.ts";

export type GraphQLPlugin = () => Array<Plugin>;

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
