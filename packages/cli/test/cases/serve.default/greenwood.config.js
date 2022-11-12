export default {
  devServer: {
    proxy: {
      '/posts': 'https://jsonplaceholder.typicode.com'
    }
  },
  port: 8181
};