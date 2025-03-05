// https://greenwoodjs.dev/docs/content-as-data/pages-data/#schema
export type Page = {
  id: string;
  title: string;
  label: string;
  route: string;
  data?: object;
};

export type Collection = Page[];
export type Graph = Page[];

// https://greenwoodjs.dev/docs/content-as-data/data-client/
export type GetContent = () => Promise<Graph>;
export type GetContentByCollection = (collection: string) => Promise<Graph>;
export type GetContentByRoute = (route: string) => Promise<Graph>;
