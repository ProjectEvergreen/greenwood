---
path: '/hello'
label: 'hello'
template: 'page'
imports:
  CSS: '../templates/theme.css'
---

### Test App

This is a test app using a custom user template!

```render js
var test = 'test';
```

```render
<style>${CSS}</style>
```