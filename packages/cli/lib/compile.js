require('colors');
const initConfig = require('./config');
const initContext = require('./init');
const generateGraph = require('./graph');
const generateScaffolding = require('./scaffold');

module.exports = generateCompilation = () => {
  return new Promise(async (resolve, reject) => {
    try {

      let compilation = {
        graph: [],
        context: {},
        config: {}
      };      

      // read from defaults/config file
      console.log('Reading project config');
      compilation.config = await initConfig();

      console.log(compilation);

      // determine whether to use default template or user detected workspace
      console.log('Initializing project workspace contexts');
      compilation.context = await initContext(compilation);

      // generate a graph of all pages / components to build
      console.log('Generating graph of workspace files...');
      compilation.graph = await generateGraph(compilation);
    
      // generate scaffolding
      console.log('Scaffolding out project files...');
      await generateScaffolding(compilation);

      resolve(compilation);
    } catch (err) {
      reject(err);
    }
  });
};