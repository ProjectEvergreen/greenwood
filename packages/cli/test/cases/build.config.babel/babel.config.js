module.exports = {
  sourceType: 'unambiguous',
  ignore: [/[\/\\]core-js/, /@babel[\/\\]runtime/],
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'entry',
        corejs: { 
          version: 3,
          proposals: true
        },
        configPath: __dirname
      }
    ]
  ],

  // Here we've deliberately removed plugins so that it will compile but won't compile correctly which we can test for
  plugins: []
};