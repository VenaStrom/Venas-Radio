import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** @type {import("next/dist/server/config-shared").ESLintConfig} */
const eslintConfig = [
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
    rules: {
      "no-unused-vars": [
        "warning",
        { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
      ],
    }
  })
];

export default eslintConfig;
