import { readAndMergeConfig as initConfig } from './config.js';
import { initContext } from './context.js';
import { generateGraph } from './graph.js';

const generateCompilation = () => {
  return new Promise(async (resolve, reject) => {
    try {

      let compilation = {
        graph: [],
        context: {},
        config: {},
        resources: new Map()
      };

      console.info('Initializing project config');
      compilation.config = await initConfig();

      // determine whether to use default template or user detected workspace
      console.info('Initializing project workspace contexts');
      compilation.context = await initContext(compilation);
      
      // generate a graph of all pages / components to build
      console.info('Generating graph of workspace files...');
      // compilation = await generateGraph(compilation);

      resolve(compilation);
    } catch (err) {
      reject(err);
    }
  });
};

export { generateCompilation };