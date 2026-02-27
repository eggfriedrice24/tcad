import antfu from "@antfu/eslint-config";

export default antfu(
  {
    type: "app",
    react: {
      overrides: {
        "react/no-implicit-key": "off",
        "react/no-leaked-conditional-rendering": "off",
        "react/no-unused-props": "off",
        "react/prefer-read-only-props": "off",
      },
    },
    typescript: true,
    formatters: true,
    stylistic: {
      indent: 2,
      quotes: "double",
      semi: true,
    },
    ignores: [
      "node_modules/*",
      "dist/*",
      "src-tauri/*",
      ".claude/**",
      "**/*.md",
    ],
  },
  {
    rules: {
      "ts/no-redeclare": "off",
      "ts/consistent-type-definitions": ["error", "type"],
      "no-console": ["warn"],
      "antfu/no-top-level-await": "off",
      "node/prefer-global/process": "off",
      "perfectionist/sort-imports": ["error"],
      "unicorn/filename-case": ["error", {
        case: "kebabCase",
        ignore: ["README.md", "CLAUDE.md"],
      }],
    },
  },
  {
    files: ["**/*.tsx"],
    rules: {
      "ts/explicit-function-return-type": "off",
    },
  },
  {
    files: ["src/components/ui/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
      "react/no-array-index-key": "off",
    },
  },
);
