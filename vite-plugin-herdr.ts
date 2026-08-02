import type { Plugin } from "vite";
import { spawn, spawnSync } from "node:child_process";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseHerdrRunning(stdout: string): boolean {
  try {
    const parsed = JSON.parse(stdout.trim()) as { status?: string; running?: boolean };
    return parsed.status === "running" || parsed.running === true;
  } catch {
    return false;
  }
}

function probeHerdrServer(): boolean {
  const result = spawnSync("herdr", ["status", "server", "--json"], {
    encoding: "utf8",
  });
  if (result.status !== 0) return false;
  return parseHerdrRunning(result.stdout);
}

let ensurePromise: Promise<boolean> | null = null;

async function ensureHerdrServer(): Promise<boolean> {
  if (probeHerdrServer()) return true;
  if (!ensurePromise) {
    ensurePromise = (async () => {
      const child = spawn("herdr", ["server"], { detached: true, stdio: "ignore" });
      child.unref();
      for (let i = 0; i < 30; i += 1) {
        await sleep(200);
        if (probeHerdrServer()) return true;
      }
      return false;
    })().finally(() => {
      ensurePromise = null;
    });
  }
  return ensurePromise;
}

export function herdrApiPlugin(): Plugin {
  return {
    name: "herdr-api",
    configureServer(server) {
      server.middlewares.use("/api/herdr/connect", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }

        void ensureHerdrServer().then((online) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ online }));
        });
      });

      server.middlewares.use("/api/herdr/run", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          void (async () => {
            let args: string[];
            try {
              args = JSON.parse(body).args as string[];
              if (!Array.isArray(args)) throw new Error("args must be array");
            } catch (e) {
              res.statusCode = 400;
              res.end(String(e));
              return;
            }

            await ensureHerdrServer();

            const child = spawn("herdr", args, { stdio: ["ignore", "pipe", "pipe"] });
            let stdout = "";
            let stderr = "";
            child.stdout.on("data", (d) => {
              stdout += d;
            });
            child.stderr.on("data", (d) => {
              stderr += d;
            });
            child.on("close", (code) => {
              if (code !== 0) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "text/plain");
                res.end(stderr || stdout || `herdr exited ${code}`);
                return;
              }
              res.setHeader("Content-Type", "text/plain");
              res.end(stdout);
            });
          })();
        });
      });
    },
  };
}
