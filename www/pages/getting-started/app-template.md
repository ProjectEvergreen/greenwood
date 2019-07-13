## Custom App Template

A custom `app-template.js` must follow the [default app template](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js) in that it must include the lit-redux-router, redux, redux-thunk, lazy-reducer-enhancer and it must create a redux store. You may import any additional components or tools you wish but the `import './list';` must be included in order to import all your generated static page components. Do not change the path and you can `ignore the fact that this file doesn't exist`, it will be created on build in memory. In the render function, it must include somewhere:

`MYROUTES`


`MYROUTES` is a placeholder for where all your generated page routes will be automatically placed. It must be present beneath a default root route. You may change the component of this root route but not the path.