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

  statements: 80,
  branches: 60,
  functions: 90,
  lines: 80,

  watermarks: {
    lines: [75, 90],
    functions: [75, 90],
    branches: [75, 90],
    statements: [75, 90]
  }
};