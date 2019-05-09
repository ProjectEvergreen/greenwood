module.exports = {
  workspace: 'src2',
  publicPath: '/',
  devServer: {
    port: 1984,
    host: 'http://localhost'
  },
  title: 'Mock App',
  meta: [
    { property: 'og:site', content: 'greenwood' },
    { name: 'twitter:site', content: '@PrjEvergreen ' }
  ]
};