export default {
  devServer: {
    proxy: {
      '/api': 'https://www.analogstudios.net'
    }
  },
  port: 8181
};