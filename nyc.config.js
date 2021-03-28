module.exports = {
  
  all: true,
  
  include: [
    'packages/cli/src/commands/*.js',
    'packages/cli/src/lib/*.js',
    'packages/cli/src/lifecycles/*.js',
    'packages/cli/src/plugins/*.js',
    'packages/plugin-*/src/*.js'
  ],

  reporter: [
    'cobertura',
    'html',
    'text',
    'text-summary'
  ],

  checkCoverage: true,

  // TODO try and match previous thresholds after mode / optimization PR merge
  // statements: 85,
  // branches: 75,
  // functions: 90,
  // lines: 85,

  statements: 80,
  branches: 65,
  functions: 85,
  lines: 80,

  watermarks: {
    statements: [75, 85],
    branches: [75, 85],
    functions: [75, 85],
    lines: [75, 85]
  }
};