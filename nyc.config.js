module.exports = {
  
  all: true,
  
  include: [
    'packages/cli/lib/*.js',
    'packages/cli/lifecycles/*.js',
    'packages/cli/plugins/*.js',
    'packages/cli/tasks/*.js'
  ],

  reporter: [
    'cobertura',
    'html',
    'text',
    'text-summary'
  ],

  checkCoverage: true,

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