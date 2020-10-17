module.exports = {
  
  all: true,
  
  include: [
    'packages/cli/src/commands/*.js',
    'packages/cli/src/data/*.js',
    'packages/cli/src/lib/*.js',
    'packages/cli/src/lifecycles/*.js',
    'packages/plugin-*/src/*.js'
  ],

  reporter: [
    'cobertura',
    'html',
    'text',
    'text-summary'
  ],

  checkCoverage: false, // TODO renable

  statements: 85,
  branches: 75,
  functions: 90,
  lines: 85,

  watermarks: {
    statements: [75, 85],
    branches: [75, 85],
    functions: [75, 85],
    lines: [75, 85]
  }
};