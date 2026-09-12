/* global Deno */

const denoLoaderHooks = {
  resolve(specifier, context, nextResolve) {
    // Work around the native-addon half of the same Deno loader-hooks issue.
    // Rollup's native `.node` binding is otherwise compiled as JavaScript.
    // https://github.com/denoland/deno/pull/36243
    // TODO: need to figure out how to manage this dependency
    if (specifier === "rollup") {
      return nextResolve("npm:@rollup/wasm-node@4.62.3", context);
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
