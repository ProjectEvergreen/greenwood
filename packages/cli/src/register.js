import { register } from 'node:module';

register('./loader.js', import.meta.url);

// await import('./index.js');