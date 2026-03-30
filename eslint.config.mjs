import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = dirname(currentFilePath);

const flatCompat = new FlatCompat({
  baseDirectory: currentDirectoryPath
});

const eslintConfiguration = [
  ...flatCompat.extends("next/core-web-vitals", "next/typescript")
];

export default eslintConfiguration;
