// TODO require('colors');
const initConfig = require('./config');
const initContext = require('./context');
const generateGraph = require('./graph');
// const generateScaffolding = require('./scaffold');

module.exports = generateCompilation = () => {
  return new Promise(async (resolve, reject) => {
    try {

      let compilation = {
        graph: [],
        context: {},
        config: {}
      };

      // read from defaults/config file
      console.info('Initializing project config');
      compilation.config = await initConfig();

      // determine whether to use default template or user detected workspace
      console.info('Initializing project workspace contexts');
      compilation.context = await initContext(compilation);
      
      // generate a graph of all pages / components to build
      // TODO make this async somehow / run in parallel?
      console.info('Generating graph of workspace files...');
      compilation = await generateGraph(compilation);

      // // generate scaffolding
      // console.log('Scaffolding out project files...');
      // await generateScaffolding(compilation);

      resolve(compilation);
    } catch (err) {
      reject(err);
    }
  });
};