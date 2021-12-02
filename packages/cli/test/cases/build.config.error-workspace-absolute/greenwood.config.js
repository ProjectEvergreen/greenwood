import { fileURLToPath, URL } from 'url';

export default {
  workspace: fileURLToPath(new URL('./noop', import.meta.url))
};