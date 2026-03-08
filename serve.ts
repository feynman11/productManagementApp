import path from "node:path";
import fs from "node:fs";

const distDir = path.resolve(import.meta.dirname, "dist");
const clientDir = path.join(distDir, "client");

// Import the SSR server entry
const ssrEntry = await import("./dist/server/server.js");

// Build a map of static files for Bun.serve's static option
function collectStaticFiles(dir: string, prefix = ""): Record<string, Response> {
  const files: Record<string, Response> = {};
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const urlPath = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      Object.assign(files, collectStaticFiles(fullPath, urlPath));
    } else {
      const file = Bun.file(fullPath);
      files[urlPath] = new Response(file, {
        headers: {
          "Content-Type": file.type,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }
  return files;
}

const staticFiles = collectStaticFiles(clientDir);

const server = Bun.serve({
  port: Number(process.env.PORT) || 3000,
  static: staticFiles,
  async fetch(req) {
    return ssrEntry.default.fetch(req);
  },
});

console.log(`Server listening on http://localhost:${server.port}`);
