export default {
  "*.js": ["npm run lint:js --"],
  "*.*": ["npm run lint:ls --", "npm run format:check --"],
};
