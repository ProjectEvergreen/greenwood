require('colors');
const initDirectories = require('./init');
const generateGraph = require('./graph');
const generateScaffolding = require('./scaffold');

module.exports = generateBuild = () => {
  return new Promise(async (resolve, reject) => {
    try {

      let compilation = {
        graph: []
      };      

      // determine whether to use default template or user directories
      console.log('Checking src directory');
      let config = await initDirectories();

      // generate a graph of all pages / components to build
      console.log('Generating graph of project files...');
      let graph = await generateGraph(config, compilation);

      compilation.graph = compilation.graph.concat(graph);
    
      // generate scaffolding
      console.log('Scaffolding out application files...');
      await generateScaffolding(config, compilation);
      resolve({ config, compilation });
    } catch (err) {
      reject(err);
    }
  });
};