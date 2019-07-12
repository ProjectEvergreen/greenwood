# Development

You can compile your static site in development mode using:

```render bash
yarn develop
```

Your development server will then be accessible at [http://localhost:1984](http://localhost:1984) by default.

You can adjust the dev server settings by creating a greenwood.config.js file in your project workspace.

```render shell
module.exports = {
    devServer: {
      port: 1984,
      host: 'localhost'
    }
};
```