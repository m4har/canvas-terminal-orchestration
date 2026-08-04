import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const copies = [
  ["shared/design-tokens.css", "landing/src/design-tokens.css"],
  ["shared/demo-layout.ts", "landing/src/lib/demo-layout.ts"],
];

for (const [from, to] of copies) {
  const source = resolve(root, from);
  const target = resolve(root, to);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  console.log(`Synced ${from} → ${to}`);
}
