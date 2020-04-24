const MOCK_CONFIG = {
  config: {
    devServer: {
      port: 1984,
      host: 'localhost'
    },
    meta: [
      { name: 'twitter:site', content: '@PrjEvergreen' },
      { rel: 'icon', href: '/assets/favicon.ico' }
    ],
    publicPath: '/some-dir',
    title: 'My App',
    workspace: 'src'
  }
};

module.exports = MOCK_CONFIG;