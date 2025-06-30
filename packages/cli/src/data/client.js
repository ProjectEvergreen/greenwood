import {
  filterContentByCollection,
  filterContentByRoute,
} from "@greenwood/cli/src/lib/content-utils.js";

const CONTENT_STATE = globalThis.__CONTENT_AS_DATA_STATE__ ?? false;
const PRERENDER = globalThis.__CONTENT_OPTIONS__?.PRERENDER === "true";
const PORT = globalThis?.__CONTENT_OPTIONS__?.PORT ?? 1984;
const BASE_PATH = globalThis?.__GWD_BASE_PATH__ ?? "";

async function getContentAsData(key = "") {
  if (CONTENT_STATE && PRERENDER) {
    // fetch customized query files when a user has opted-in for prerendering with active content
    return await fetch(
      `${window.location.origin}${BASE_PATH}/data-${key.replace(/\//g, "_")}.json`,
    ).then((resp) => resp.json());
  } else if (CONTENT_STATE && !PRERENDER) {
    // if user is not prerendering, just fetch the entire graph but apply the same filtering
    const graph = await fetch("/graph.json").then((resp) => resp.json());
    const value = key.split("-").pop();

    if (key === "graph") {
      return graph;
    } else if (key.startsWith("collection")) {
      return filterContentByCollection(graph, value);
    } else if (key.startsWith("route")) {
      return filterContentByRoute(graph, value);
    }
  } else {
    // otherwise users is developing locally, so hit the dev server
    return await fetch(`http://localhost:${PORT}${BASE_PATH}/___graph.json`, {
      headers: { "X-CONTENT-KEY": key },
    }).then((resp) => resp.json());
  }
}

/** @type {import('../types/content.d.ts').GetContent} */
async function getContent() {
  return await getContentAsData("graph");
}

/** @type {import('../types/content.d.ts').GetContentByCollection} */
async function getContentByCollection(collection = "") {
  return await getContentAsData(`collection-${collection}`);
}

/** @type {import('../types/content.d.ts').GetContentByRoute} */
async function getContentByRoute(route = "") {
  return await getContentAsData(`route-${route}`);
}

export { getContent, getContentByCollection, getContentByRoute };
