import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "shared/design-tokens.css");
const target = resolve(root, "landing/src/design-tokens.css");

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log("Synced shared/design-tokens.css → landing/src/design-tokens.css");
