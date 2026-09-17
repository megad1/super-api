import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let file = normalize(join(root, relative));

  if (file.startsWith(root) && existsSync(file) && statSync(file).isDirectory()) {
    file = join(file, "index.html");
  } else if (file.startsWith(root) && !existsSync(file) && !extname(file) && existsSync(`${file}.html`)) {
    file = `${file}.html`;
  }

  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Arquivo não encontrado.");
    return;
  }

  response.writeHead(200, {
    "Content-Type": types[extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Funil disponível em http://127.0.0.1:${port}`);
});
