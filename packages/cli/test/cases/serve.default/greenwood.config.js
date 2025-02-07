export default {
  devServer: {
    proxy: {
      "/posts": "https://jsonplaceholder.typicode.com",
    },
  },
  port: 8181,
  activeContent: true, // just here to test some of the setup <script> output
};
