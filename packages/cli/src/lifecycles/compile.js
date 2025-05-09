import { checkResourceExists } from "../lib/resource-utils.js";
import { generateGraph } from "./graph.js";
import { initContext } from "./context.js";
import { readAndMergeConfig } from "./config.js";
import fs from "fs/promises";

const generateCompilation = async () => {
  let compilation = {
    graph: [],
    context: {},
    config: {},
    // TODO put resources into manifest
    resources: new Map(),
    manifest: {
      apis: new Map(),
    },
    collections: {},
  };

  console.info("Initializing project config");
  compilation.config = await readAndMergeConfig();

  // determine whether to use default layout or user detected workspace
  console.info("Initializing project workspace contexts");
  compilation.context = await initContext(compilation);

  const { scratchDir, outputDir } = compilation.context;

  if (!(await checkResourceExists(scratchDir))) {
    await fs.mkdir(scratchDir);
  }

  if (process.env.__GWD_COMMAND__ === "serve") {
    console.info("Loading graph from build output...");

    if (!(await checkResourceExists(new URL("./graph.json", outputDir)))) {
      return Promise.reject(
        new Error("No build output detected.  Make sure you have run greenwood build"),
      );
    }

    compilation.graph = JSON.parse(await fs.readFile(new URL("./graph.json", outputDir), "utf-8"));

    if (await checkResourceExists(new URL("./manifest.json", outputDir))) {
      console.info("Loading manifest from build output...");
      // TODO put reviver into a utility?
      const manifest = JSON.parse(
        // @ts-expect-error see https://github.com/microsoft/TypeScript/issues/42866
        await fs.readFile(new URL("./manifest.json", outputDir)),
        function reviver(key, value) {
          if (typeof value === "object" && value !== null) {
            if (value.dataType === "Map") {
              return new Map(value.value);
            }
          }
          return value;
        },
      );

      compilation.manifest = manifest;
    }

    if (await checkResourceExists(new URL("./resources.json", outputDir))) {
      console.info("Loading resources from build output...");
      // TODO put reviver into a utility?
      const resources = JSON.parse(
        // @ts-expect-error see https://github.com/microsoft/TypeScript/issues/42866
        await fs.readFile(new URL("./resources.json", outputDir)),
        function reviver(key, value) {
          if (typeof value === "object" && value !== null) {
            if (value.dataType === "Map") {
              // revive URLs
              if (value.value.sourcePathURL) {
                value.value.sourcePathURL = new URL(value.value.sourcePathURL);
              }

              return new Map(value.value);
            }
          }
          return value;
        },
      );

      compilation.resources = resources;
    }
  } else {
    // generate a graph of all pages / components to build
    console.info("Generating graph of workspace files...");
    compilation = await generateGraph(compilation);

    // https://stackoverflow.com/a/56150320/417806
    // TODO put reviver into a util?
    await fs.writeFile(
      new URL("./manifest.json", scratchDir),
      JSON.stringify(compilation.manifest, (key, value) => {
        if (value instanceof Map) {
          return {
            dataType: "Map",
            value: [...value],
          };
        } else {
          return value;
        }
      }),
    );

    await fs.writeFile(new URL("./graph.json", scratchDir), JSON.stringify(compilation.graph));
  }

  return Promise.resolve(compilation);
};

export { generateCompilation };
