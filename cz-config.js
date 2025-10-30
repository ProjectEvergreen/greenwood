// NOTE: need to keep types and scope consistent with commitlint.config.js
// https://commitizen.github.io/cz-cli/
const types = [
  { value: "feature", name: "feature:         ✨  A new feature" },
  {
    value: "enhancement",
    name: "enhancement:     💪  A code change that neither fixes a bug nor adds a feature",
  },
  { value: "fix", name: "fix:             🐛  A bug fix" },
  { value: "chore", name: "chore:           🛠   Other changes that don't modify src files" },
  { value: "docs", name: "docs:            📚  Documentation only changes" },
  { value: "revert", name: "revert:          🗑   Reverts a previous commit" },
];

const scopes = [
  {
    value: "cli",
    name: "cli:          ♻️   Changes to the core CLI",
  },
  {
    value: "init",
    name: "init:         ⚡  Changes to the init CLI",
  },
  {
    value: "plugins",
    name: "plugins:      🔌  Changes to any plugins",
  },
  {
    value: "adapters",
    name: "adapters:     🤝  Changes to any adapters",
  },
  {
    value: "runtimes",
    name: "runtimes:     🏃  Changes related to supporting runtimes",
  },
  {
    value: "types",
    name: "types:        🤓  Type or TypeScript specific changes",
  },
  {
    value: "deps",
    name: "deps:         📦  Updating dependencies (for renovate)",
  },
  {
    value: "workspace",
    name: "workspace:    🏗️   Changes to the monorepo or CI",
  },
];

export default {
  prompter: async (cz, commit) => {
    const { type } = await cz.prompt([
      {
        type: "list",
        name: "type",
        message: "Select the type of the change",
        choices: types,
      },
    ]);

    const { scope } = await cz.prompt([
      {
        type: "list",
        name: "scope",
        message: "Select the scope of the change",
        choices: scopes,
      },
    ]);

    const { subject } = await cz.prompt([
      {
        type: "input",
        name: "subject",
        message: "Write a short, imperative description of the change",
        validate: (input) => {
          if (input.length === 0) {
            return "Subject is required";
          }

          return true;
        },
      },
    ]);

    const { breaking } = await cz.prompt([
      {
        type: "list",
        name: "breaking",
        message: "Is this a breaking change?",
        choices: ["Yes", "No"],
      },
    ]);

    const { issue } = await cz.prompt([
      {
        type: "input",
        name: "issue",
        message: "Enter the issue associated with this change (e.g. 123)",
        validate: (input) => {
          if (input.startsWith("#")) {
            return "Please do not include the #";
          }

          return true;
        },
      },
    ]);

    const issueFormat = issue === "" ? "" : `#${issue} `;
    const breakingFormat = breaking === "Yes" ? "!" : "";
    const message = `${type}(${scope})${breakingFormat}: ${issueFormat}${subject}`;

    commit(message);
  },
};
