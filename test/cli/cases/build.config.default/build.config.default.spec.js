// const expect = require('chai').expect;
// const path = require('path');
// const initConfig = require('../../../packages/cli/lib/config');
const TestSetup = require('../../setup');
// let defaultConfig = {
//   workspace: '/Users/owenbuckley/Workspace/project-evergreen/repos/greenwood/src',
//   devServer: {
//     port: 1984,
//     host: 'http://localhost'
//   },
//   publicPath: '/'
// };

describe('Build Command: Default Configuration', () => {
  let setup;

  before(async () => {
    setup = new TestSetup(true);
    setup.initContext();
    // CONTEXT = await setup.init();

    // await setup.run(['./packages/cli/index.js', 'build']);
  });

  beforeEach(async() => {
    // setup = new TestSetup(true);
    // setup.init();
    await setup.runCommand('build');
  });

  // before(async () => {
  //   config = await initConfig();
  // });

  it('should create a public directory', () => {
    // expect(fs.existsSync(CONTEXT.publicDir)).to.be.true;
  });

});