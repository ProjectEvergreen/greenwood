export default {
  basePath: '/my-path',
  devServer: {
    proxy: {
      '/posts': 'https://jsonplaceholder.typicode.com'
    }
  }
};