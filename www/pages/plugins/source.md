---
label: 'source'
menu: side
title: 'Source'
index: 7
---

## Source

The source plugin allows users to include external content as pages that will be statically generated just like if they were a markdown or HTML in your _pages/_ directory.  This would be the primary API to include content from a headless CMS, database, the filesystem, SaaS provider (Notion, AirTables) or wherever else you keep it.

> See our [docs on _External Sources_](/docs/data/#external-sources) for more information on working with data in Greenwood.

## API
This plugin supports providing an array of "page" objects that will be added as nodes in [the graph](/docs/data/).

```js
// my-source-plugin.js
export const customExternalSourcesPlugin = (options = {}) => {
  type: 'source',
  name: 'source-plugin-myapi',
  provider: () => {
    return async function () {
      // this could just as easily come from an API, DB, Headless CMS, etc
      const artists = await fetch('http://www.myapi.com/...').then(resp => resp.json());

      return artists.map((artist) => {
        const { bio, id, imageUrl, name } = artist;
        const route = `/artists/${name.toLowerCase().replace(/ /g, '-')}/`;

        return {
          title: name,
          body: `
            <h1>${name}</h1>
            <p>${bio}</p>
            <img src='${imageUrl}'/>
          `,
          route,
          id,
          label: name
        };
      });
    };
  }
};
```

In the above example, you would have the following three data statically generated in the output directory

```bash
.
└── public/
  └── artists/
    ├── <name1>/index.html
    ├── <name2>/index.html
    └── <nameN>/index.html
```


and accessible at the following routes in the browser
- `/artists/<name1>/`
- `/artists/<name2>/`
- `/artists/<nameN>/`
- ...