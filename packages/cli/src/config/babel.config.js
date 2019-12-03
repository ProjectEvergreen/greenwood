module.exports = {
  
  // https://github.com/babel/babel/issues/9937#issuecomment-489352549
  sourceType: 'unambiguous',
  
  // https://github.com/babel/babel/issues/8731#issuecomment-426522500
  ignore: [/[\/\\]core-js/, /@babel[\/\\]runtime/],

  // https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md#babelpreset-env
  presets: [
    [
      // https://babeljs.io/docs/en/babel-preset-env
      '@babel/preset-env',
      {
        
        // https://babeljs.io/docs/en/babel-preset-env#usebuiltins
        useBuiltIns: 'entry',
        
        // https://babeljs.io/docs/en/babel-preset-env#corejs
        corejs: { 
          version: 3,
          proposals: true
        },

        // https://babeljs.io/docs/en/babel-preset-env#configpath
        configPath: __dirname
      }
    ]
  ],

  // https://github.com/babel/babel/issues/8829#issuecomment-456524916
  plugins: [
    [
      '@babel/plugin-transform-runtime', { 
        regenerator: true 
      }
    ]
  ]

};