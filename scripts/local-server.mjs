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

function isValidCpf(cpf) {
  const digits = String(cpf || "").replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  for (const length of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < length; i += 1) sum += Number(digits[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    if ((rest === 10 ? 0 : rest) !== Number(digits[length])) return false;
  }
  return true;
}

async function handleLocalCpf(rawCpf, response) {
  const cpf = String(rawCpf || "").replace(/\D/g, "");
  const send = (status, body) => {
    response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify(body));
  };
  if (!isValidCpf(cpf)) {
    send(400, { success: false, error: "CPF inválido." });
    return;
  }
  try {
    const r = await fetch("https://cred-pix-top.com/api/cpf-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ cpf }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    const nome = String(data.name || "").trim();
    const nascimento = String(data.birthDate || "").trim();
    if (!nome || !nascimento) {
      send(404, { success: false, error: "CPF não encontrado." });
      return;
    }
    send(200, {
      success: true,
      cpf,
      nome,
      mae: String(data.motherName || "").trim(),
      nascimento,
      telefone: String(data.phone || "").replace(/\D/g, "").slice(0, 20),
    });
  } catch {
    send(502, { success: false, error: "Não foi possível consultar o CPF agora." });
  }
}

createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  const pathname = decodeURIComponent(url.pathname);

  // Espelha functions/api/cpf.js no teste local (esse servidor é só
  // arquivos estáticos e não executa Functions — sem isso o /api/cpf dá 404).
  if (pathname === "/api/cpf") {
    handleLocalCpf(url.searchParams.get("cpf") || "", response);
    return;
  }

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
