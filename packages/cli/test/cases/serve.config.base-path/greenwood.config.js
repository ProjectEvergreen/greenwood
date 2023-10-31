export default {
  basePath: '/my-path',
  staticRouter: true,
  devServer: {
    proxy: {
      '/posts': 'https://jsonplaceholder.typicode.com'
    }
  }
};