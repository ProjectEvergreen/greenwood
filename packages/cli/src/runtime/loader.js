// runtime-agnostic async service around Greenwood's resource plugin / transformation handling to be leveraged by all runtimes
async function initializeLoader() {
  // import Greenwood's internals dynamically to provide greater control to runtimes to when loader hooks are customized
  const [{ readAndMergeConfig }, { initContext }, { mergeResponse }] = await Promise.all([
    import("../lifecycles/config.js"),
    import("../lifecycles/context.js"),
    import("../lib/resource-utils.js"),
  ]);
  const config = await readAndMergeConfig();
  const context = await initContext({ config });
  const resourcePlugins = config.plugins
    .filter((plugin) => plugin.type === "resource")
    .filter(
      (plugin) =>
        plugin.name !== "plugin-node-modules:resource" && plugin.name !== "plugin-user-workspace",
    )
    .map((plugin) =>
      plugin.provider({
        context,
        config,
        graph: [],
      }),
    );

  async function getCustomLoaderResponse(initUrl, checkOnly = false) {
    const headers = {
      Accept: "text/javascript",
    };
    const initResponse = new Response("");
    const request = new Request(initUrl, { headers });
    let url = initUrl;
    let response = initResponse.clone();
    let shouldHandle = false;

    for (const plugin of resourcePlugins) {
      if (
        initUrl.protocol === "file:" &&
        plugin.shouldResolve &&
        (await plugin.shouldResolve(initUrl, request))
      ) {
        shouldHandle = true;

        if (!checkOnly) {
          url = new URL((await plugin.resolve(initUrl, request)).url);
        }
      }
    }

    for (const plugin of resourcePlugins) {
      if (plugin.shouldServe && (await plugin.shouldServe(initUrl, request))) {
        shouldHandle = true;

        if (!checkOnly) {
          response = mergeResponse(response, await plugin.serve(initUrl, request));
        }
      }
    }

    for (const plugin of resourcePlugins) {
      if (
        plugin.shouldPreIntercept &&
        (await plugin.shouldPreIntercept(url, request, response.clone()))
      ) {
        shouldHandle = true;

        if (!checkOnly) {
          response = mergeResponse(
            response,
            await plugin.preIntercept(url, request, response.clone()),
          );
        }
      }

      if (
        plugin.shouldIntercept &&
        (await plugin.shouldIntercept(url, request, response.clone()))
      ) {
        shouldHandle = true;

        if (!checkOnly) {
          response = mergeResponse(
            response,
            await plugin.intercept(url, request, response.clone()),
          );
        }
      }
    }

    return {
      shouldHandle,
      response,
    };
  }

  return {
    async resolve(source) {
      const url = new URL(source);
      const { shouldHandle } = await getCustomLoaderResponse(url, true);

      return { shouldHandle };
    },
    async load(source) {
      const extension = source.split(".").pop();
      const url = new URL(source);
      const { shouldHandle } = await getCustomLoaderResponse(url, true);

      if (
        (config.useTsc && extension === "ts") ||
        (shouldHandle && extension !== "js" && extension !== "ts")
      ) {
        const { response } = await getCustomLoaderResponse(url);
        const contents = await response.text();

        return {
          format: "module",
          source: contents,
          shortCircuit: true,
        };
      }

      return undefined;
    },
  };
}

export { initializeLoader };
