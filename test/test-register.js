import { register } from 'node:module';

register('./test-loader.js', import.meta.url);

// await import('./index.js');