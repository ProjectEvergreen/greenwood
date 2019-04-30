require('colors');
const initContext = require('./init');
const generateGraph = require('./graph');
const generateScaffolding = require('./scaffold');

// TODO would like to move graph and scaffold to the top more maybe?
module.exports = generateCompilation = () => {
  
  return new Promise(async (resolve, reject) => {
    try {
      
      let compilation = {
        graph: [],
        context: {}
      };    

      // determine whether to use default template or user detected workspace
      console.log('Initializing project workspace contexts');
      const context = await initContext(compilation);

      compilation.context = context;

      // generate a graph of all pages / components to build
      console.log('Generating graph of workspace files...');
      const graph = await generateGraph(compilation);
      
      compilation.graph = graph;
    
      // generate scaffolding
      console.log('Scaffolding out project files...');
      await generateScaffolding(compilation);

      resolve(compilation);
    } catch (err) {
      reject(err);
    }
  });
};