## Plugins

At it's core, Greenwood provides a CLI and some configuration options to enable users to develop and build their projects quickly and simply from markdown.  However, more complex sites and use cases there will come a need to be able to extend the default functionality of Greenwood to support additional capabilities like:
- Site Analytics (Google, Snowplow)
- Progressive Web App experiences (PWA)
- Consuming content from a CMS (like Wordpress, Drupal)
- Whatever you can think of!

Greenwood aims to cater to all these use cases through two ways:
1. A plugin based architecture exposing low level "primitives" of the Greenwood build that anyone can extend.
1. A set of pre-built plugins to help facilitate some of the most common uses cases and workflows, that don't require needing to know anything about the low level APIs.


### APIs
While each API has its own documentation section on the left sidebar of this page, here is a quick overview of the current set of Plugin APIs Greenwood supports.

#### Template Hooks
It is common when working with certain libraries (3rd party or otherwise) that scripts _must_ be loaded globally and / or unbundled.  Good examples of these are analytics libraries and polyfills.  With a template hook plugin, users can leverage predefined "injection" sites to add this code to their project's _index.html_.