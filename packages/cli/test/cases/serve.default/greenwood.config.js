module.exports = {
  devServer: {
    proxy: {
      '/api': 'https://www.analogstudios.net'
    }
  }
};