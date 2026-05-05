import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // We rely on TypeScript for this; keep eslint config minimal.
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
]);

