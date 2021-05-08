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

  statements: 80,
  branches: 60,
  functions: 80,
  lines: 80,

  watermarks: {
    statements: [75, 85],
    branches: [75, 85],
    functions: [75, 85],
    lines: [75, 85]
  }
};