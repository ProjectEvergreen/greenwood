module.exports = {
  plugins: ['stylelint-a11y'],
  extends: [
    'stylelint-config-standard',
    'stylelint-a11y/recommended'
  ],
  rules: {
    'no-empty-source': null,
    'declaration-empty-line-before': null,
    'no-missing-end-of-source-newline': null,
    'value-list-comma-newline-after': null,
    'declaration-colon-newline-after': null,
    'value-keyword-case': null,
    'declaration-bang-space-before': null,
    'selector-type-no-unknown': [true, {
      ignore: ['custom-elements'],
      ignoreTypes: ['/^app-/']
    }]
  }
};