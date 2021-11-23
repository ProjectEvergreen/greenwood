export default {
  devServer: {
    proxy: {
      '/api': 'https://www.analogstudios.net'
    }
  }
};