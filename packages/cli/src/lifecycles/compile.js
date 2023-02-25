import { checkResourceExists } from '../lib/resource-utils.js';
import { generateGraph } from './graph.js';
import { initContext } from './context.js';
import fs from 'fs/promises';
import { readAndMergeConfig as initConfig } from './config.js';

const generateCompilation = () => {
  return new Promise(async (resolve, reject) => {
    try {

      let compilation = {
        graph: [],
        context: {},
        config: {},
        resources: new Map(),
        manifest: {
          apis: new Map()
        }
      };

      console.info('Initializing project config');
      compilation.config = await initConfig();

      // determine whether to use default template or user detected workspace
      console.info('Initializing project workspace contexts');
      compilation.context = await initContext(compilation);
      
      // generate a graph of all pages / components to build
      console.info('Generating graph of workspace files...');
      compilation = await generateGraph(compilation);

      const { apisDir, scratchDir } = compilation.context;

      if (!await checkResourceExists(scratchDir)) {
        await fs.mkdir(scratchDir);
      }

      if (checkResourceExists(apisDir)) {
        // https://stackoverflow.com/a/56150320/417806
        await fs.writeFile(new URL('./manifest.json', scratchDir), JSON.stringify(compilation.manifest, (key, value) => {
          if (value instanceof Map) {
            return {
              dataType: 'Map',
              value: [...value]
            };
          } else {
            return value;
          }
        }));
      }

      await fs.writeFile(new URL('./graph.json', scratchDir), JSON.stringify(compilation.graph));

      resolve(compilation);
    } catch (err) {
      reject(err);
    }
  });
};

export { generateCompilation };