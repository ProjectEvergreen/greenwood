// https://commitlint.js.org/reference/rules.html
export default {
  rules: {
    "type-case": [2, "always", "lower-case"],
    "type-enum": [2, "always", ["feat", "enhancement", "fix", "chore", "docs", "revert"]],
    "type-empty": [2, "never"],
    "scope-case": [2, "always", "lower-case"],
    "scope-enum": [2, "always", ["cli", "init", "plugins", "adapters", "types", "workspace"]],
    "scope-empty": [2, "never"],
    "subject-case": [2, "always", "lower-case"],
    "body-case": [2, "always", "lower-case"],
    "header-case": [2, "always", "lower-case"],
  },
  // emojis don't actually work
  // https://github.com/conventional-changelog/commitlint/issues/4534
  prompt: {
    settings: {
      enableMultipleScopes: true,
      scopeEnumSeparator: ",",
    },
    questions: {
      type: {
        description: "Select the type of change that you're committing:",
        enum: {
          feat: {
            description: "A new feature",
            title: "Features",
            emoji: "✨",
          },
          enhancement: {
            description: "A code change that neither fixes a bug nor adds a feature",
            title: "Code Refactoring",
            emoji: "💪",
          },
          fix: {
            description: "A bug fix",
            title: "Bug Fixes",
            emoji: "🐛",
          },
          chore: {
            description: "Other changes that don't modify src files",
            title: "Chores",
            emoji: "🛠",
          },
          docs: {
            description: "Documentation only changes",
            title: "Documentation",
            emoji: "📚",
          },
          revert: {
            description: "Reverts a previous commit",
            title: "Reverts",
            emoji: "🗑",
          },
        },
      },
      scope: {
        description: "What is the scope of this change (e.g. component or file name)",
        enum: {
          cli: {
            description: "CLI",
            title: "Changes to the core CLI",
            emoji: "♻️",
          },
          init: {
            description: "Init CLI",
            title: "Changes to the init CLI",
            emoji: "⚡",
          },
          plugins: {
            description: "Plugins",
            title: "Changes to any plugins",
            emoji: "📦",
          },
          adapters: {
            description: "Adapters",
            title: "Changes to any plugins",
            emoji: "⏩",
          },
          types: {
            description: "Types",
            title: "Type or TypeScript specific fixes",
            emoji: "🤓",
          },
          workspace: {
            description: "Workspace",
            title: "Changes to the monorepo",
            emoji: "🛠",
          },
        },
      },
      subject: {
        description: "Write a short, imperative tense description of the change",
      },
      isBreaking: {
        description: "Are there any breaking changes?",
      },
      breakingBody: {
        description:
          "A BREAKING CHANGE commit requires a body. Please enter a longer description of the commit itself",
      },
      breaking: {
        description: "Describe the breaking changes",
      },
      isIssueAffected: {
        description: "Does this change affect any open issues?",
      },
      issues: {
        description: 'Add issue references (e.g. "#123")',
      },
    },
  },
};
