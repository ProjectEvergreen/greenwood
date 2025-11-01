// https://commitlint.js.org/reference/rules.html
export default {
  rules: {
    "type-case": [2, "always", "lower-case"],
    "type-enum": [2, "always", ["feat", "enhancement", "fix", "chore", "docs", "revert"]],
    "type-empty": [2, "never"],
    "scope-case": [2, "always", "lower-case"],
    "scope-enum": [
      2,
      "always",
      ["cli", "init", "plugins", "adapters", "runtimes", "types", "deps", "workspace"],
    ],
    "scope-empty": [2, "never"],
    "subject-case": [2, "always", "lower-case"],
    "body-case": [2, "always", "lower-case"],
    "header-case": [2, "always", "lower-case"],
  },
};
