import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "logs/**", "server/data/**", "tools/**"],
  },
  {
    files: ["src/**/*.{js,mjs,cjs,jsx}"],
    ignores: ["src/lib/**/*", "src/components/ui/**/*"],
    ...pluginJs.configs.recommended,
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true }],
      "no-undef": "error",
      "max-lines": ["warn", { max: 500, skipBlankLines: true, skipComments: true }],
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close"] },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    // These cohesive state models and static poster stylesheet are deliberately
    // kept together; section rendering already lives in separate modules.
    files: ["src/components/admin/AdminInstaPosters.jsx", "src/components/admin/posters/posterStyles.js", "src/features/tournaments/hooks/useStageStandingsModel.js", "src/features/tournaments/admin/AdminResults.jsx"],
    rules: { "max-lines": ["error", { max: 1000, skipBlankLines: true, skipComments: true }] },
  },
];
