import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(resolve(root, "shared/design-tokens.css"), "utf8");
const target = readFileSync(resolve(root, "landing/src/design-tokens.css"), "utf8");

if (source !== target) {
  console.error(
    "landing/src/design-tokens.css is out of sync with shared/design-tokens.css.\n" +
      "Run: npm run sync:tokens",
  );
  process.exit(1);
}

console.log("Design tokens in sync.");
