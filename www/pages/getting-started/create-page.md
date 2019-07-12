## Creating A Page

Pages should be placed in your `src/pages/` directory. Page filenames will become the page's generated path. e.g.

Here's an example of a `src/pages/mypage.md`
```render md
### Hello World

This is an example page built by Greenwood.  Make your own in _src/pages_!
```

Will accessible at http://localhost:8000/mypage

You can nest directories in your `src/pages` directory which will also be used for the final URL.

e.g. a markdown file at `src/pages/myblog/mycategory/index.md` will be accessible at http://localhost:8000/myblog/mycategory

Another example a markdown file at `src/pages/myblog/mycategory/mypage.md` will be accessible at http://localhost:8000/myblog/mycategory/mypage

You can also create [custom templates](#front-matter-template) to style and layout each page. As well as [customize the overall app template](#app-template)