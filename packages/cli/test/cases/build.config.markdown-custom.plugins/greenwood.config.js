module.exports = {
  markdown: {
    settings: {},
    plugins: [
      require('rehype-slug'),
      require('rehype-autolink-headings')
    ]
  }
};