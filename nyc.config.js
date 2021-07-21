module.exports = {
  
  all: true,
  
  include: [
    'packages/*/src/**/**/*.js'
  ],

  exclude: [
    'packages/cli/src/index.js',
    'packages/**/**/*.config.js',
    'packages/cli/src/lib/*-interface.js'
  ],

  reporter: [
    'cobertura',
    'html',
    'text',
    'text-summary'
  ],

  checkCoverage: true,

  statements: 80,
  branches: 70,
  functions: 80,
  lines: 80,

  watermarks: {
    statements: [75, 85],
    branches: [75, 85],
    functions: [75, 85],
    lines: [75, 85]
  }
};