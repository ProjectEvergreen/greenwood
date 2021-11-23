import path from 'path';

export default {
  workspace: path.join(path.dirname(new URL('', import.meta.url).pathname), 'www')
};