import type { GetContentByRoute, GetContentByCollection, GetContent } from "../types/content.d.ts";

declare module "@greenwood/cli/src/data/client.js" {
  export const getContentByRoute: GetContentByRoute;
  export const getContentByCollection: GetContentByCollection;
  export const getContent: GetContent;
}
