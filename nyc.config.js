module.exports = {
  
  all: true,
  
  include: [
    'packages/cli/lib/**/*.js',
    'packages/cli/tasks/*.js'
  ],

  reporter: [
    'cobertura',
    'html',
    'text',
    'text-summary'
  ],

  checkCoverage: true,

  statements: 85,
  branches: 70,
  functions: 90,
  lines: 85,

  watermarks: {
    statements: [75, 85],
    branches: [75, 85],
    functions: [75, 85],
    lines: [75, 85]
  }
};