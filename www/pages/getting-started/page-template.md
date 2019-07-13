## Custom Page Template

All page templates must be placed in the `src/templates` directory. All page templates must be named [somename]-template.js. The default page template is `page-template.js` which you can override simply by including it. To import your markdown files within a given page-template, you must include the placeholder `MDIMPORT`. To set the position of where the markdown content will be placed within your page template, you must include an `<entry></entry>` placeholder element for the generated markdown component.

`page-template.js`

```render js
import { html, LitElement } from 'lit-element';
MDIMPORT;
METAIMPORT;
METADATA;

class PageTemplate extends LitElement {
  render() {
    return html\`
      METAELEMENT
      <div class='wrapper'>
        <div class='page-template content'>
          <entry></entry>
        </div>
      </div>
    \`;
  }
}

customElements.define('page-template', PageTemplate);
```

See [create page](/getting-started/create-page) guide for how to use a custom template with any given page.
