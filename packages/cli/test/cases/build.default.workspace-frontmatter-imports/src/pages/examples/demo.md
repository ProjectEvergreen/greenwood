---
title: Demo Page
imports:
  - /components/counter/counter.js
  - /components/counter/counter.css data-gwd-opt='none' foo='bar' baz='bar'
  - /components/multi-hyphen/multi-hyphen.js type="module" foo="bar"
  - /scripts/frontmatter-standard.js type="module"
  - /scripts/frontmatter-typescript.ts type="module"
  - /scripts/frontmatter-custom.foo type="module"
  - /styles/frontmatter-custom.scss
---

## Demo Page Example

<x-counter></x-counter>

<multihyphen-custom-element></multihyphen-custom-element>