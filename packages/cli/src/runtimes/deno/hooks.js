const denoLoaderHooks = {
  resolve(specifier, context, nextResolve) {
    // Deno compiles Rollup's native `.node` binding as JavaScript when a load hook is registered.
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

    return nextResolve(specifier, context);
  },

  load(url, context, nextLoad) {
    // Deno may leave CommonJS JSON unformatted, then parse its source as JavaScript.
    // https://github.com/ProjectEvergreen/greenwood/discussions/1810
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
