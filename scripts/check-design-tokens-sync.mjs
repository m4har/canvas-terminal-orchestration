import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const pairs = [
  ["shared/design-tokens.css", "landing/src/design-tokens.css"],
  ["shared/demo-layout.ts", "landing/src/lib/demo-layout.ts"],
];

for (const [from, to] of pairs) {
  const source = readFileSync(resolve(root, from), "utf8");
  const target = readFileSync(resolve(root, to), "utf8");

  if (source !== target) {
    console.error(`${to} is out of sync with ${from}.\nRun: npm run sync:tokens`);
    process.exit(1);
  }
}

console.log("Landing shared files in sync.");
