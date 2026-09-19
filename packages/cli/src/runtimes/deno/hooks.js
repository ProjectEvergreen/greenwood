/* global Deno */

const denoLoaderHooks = {
  resolve(specifier, context, nextResolve) {
    // Work around for Deno .node binding resolution issue with rollup
    // https://github.com/ProjectEvergreen/greenwood/discussions/1810
    if (specifier === "rollup") {
      try {
        return nextResolve("@rollup/wasm-node", context);
      } catch (error) {
        throw new Error(
          "Greenwood's Deno runtime requires @rollup/wasm-node. " +
            "Install it with `deno add --dev npm:@rollup/wasm-node@^4.59.0`.",
          { cause: error },
        );
      }
    }

    const resolution = nextResolve(specifier, context);
    const resolvedUrl = new URL(resolution.url);
    const isLegacyEsmJson =
      resolvedUrl.pathname.endsWith(".json") &&
      context.conditions.includes("import") &&
      context.importAttributes.type !== "json";

    // Older registerHooks() implementations lose JSON import attributes and
    // otherwise compile the JSON source as JavaScript.
    if (isLegacyEsmJson) {
      return {
        ...resolution,
        format: "module",
      };
    }

    return resolution;
  },

  load(url, context, nextLoad) {
    const moduleUrl = new URL(url);

    if (
      moduleUrl.pathname.endsWith(".json") &&
      context.conditions.includes("import") &&
      context.importAttributes.type !== "json"
    ) {
      const contents = Deno.readTextFileSync(moduleUrl);

      return {
        format: "module",
        source: `export default JSON.parse(${JSON.stringify(contents)});`,
        shortCircuit: true,
      };
    }

    // Deno's default hook currently leaves the format undefined for JSON loaded
    // through CommonJS require(), which gives the JSON value the wrong shape.
    if (url.endsWith(".json") && context.conditions.includes("require")) {
      return {
        ...nextLoad(url, context),
        format: "json",
      };
    }

    return nextLoad(url, context);
  },
};

export { denoLoaderHooks };
