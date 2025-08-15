// @ts-check
import eslint from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";
import tseslint from "typescript-eslint";

const tslintConfig = [...tseslint.configs.recommended];
tslintConfig[2].files = tslintConfig[1].files;

export default [
  eslint.configs.recommended,
  ...tslintConfig,
  stylistic.configs["disable-legacy"],
  {
    ignores: [],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "@stylistic/indent": "off",
      "@stylistic/linebreak-style": ["error", "unix"],
      "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
      "@stylistic/semi": ["error", "always"],
      "no-undef": "error",
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
      eqeqeq: ["error", "always"],
      "object-shorthand": "warn",
      "no-useless-constructor": "warn",
    },
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { args: "none", caughtErrors: "none" }],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-explicit-any": ["error", { ignoreRestArgs: true }],
      "no-useless-constructor": "off",
      "@typescript-eslint/no-useless-constructor": "warn",
      "@typescript-eslint/no-namespace": "off",
    },
  },
];
