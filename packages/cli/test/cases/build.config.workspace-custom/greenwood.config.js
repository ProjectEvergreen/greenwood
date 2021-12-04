import { fileURLToPath, URL } from 'url';

export default {
  workspace: fileURLToPath(new URL('./www', import.meta.url))
};