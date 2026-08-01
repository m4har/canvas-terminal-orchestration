import type { Plugin } from "vite";
import { spawn } from "node:child_process";

export function herdrApiPlugin(): Plugin {
  return {
    name: "herdr-api",
    configureServer(server) {
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
          let args: string[];
          try {
            args = JSON.parse(body).args as string[];
            if (!Array.isArray(args)) throw new Error("args must be array");
          } catch (e) {
            res.statusCode = 400;
            res.end(String(e));
            return;
          }

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
        });
      });
    },
  };
}
