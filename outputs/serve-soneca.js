const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.join(__dirname, "nap-pwa");
const HOST = "0.0.0.0";
const START_PORT = Number(process.env.PORT || 5179);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function resolveFile(url) {
  const cleanUrl = decodeURIComponent(url.split("?")[0]);
  const relative = cleanUrl === "/" ? "index.html" : cleanUrl.replace(/^\/+/, "");
  const filePath = path.normalize(path.join(ROOT, relative));

  if (!filePath.startsWith(ROOT)) return null;
  return filePath;
}

function createServer(port) {
  const server = http.createServer((req, res) => {
    const filePath = resolveFile(req.url || "/");
    if (!filePath) return send(res, 403, "Acesso negado.");

    fs.readFile(filePath, (error, data) => {
      if (error) {
        fs.readFile(path.join(ROOT, "index.html"), (fallbackError, fallback) => {
          if (fallbackError) return send(res, 404, "Arquivo nao encontrado.");
          send(res, 200, fallback, types[".html"]);
        });
        return;
      }

      send(res, 200, data, types[path.extname(filePath)] || "application/octet-stream");
    });
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && port < START_PORT + 10) {
      createServer(port + 1);
      return;
    }
    console.error(error.message);
    process.exit(1);
  });

  server.listen(port, HOST, () => {
    const addresses = getLocalAddresses();
    console.log("");
    console.log("Soneca PWA rodando.");
    console.log(`Neste computador: http://127.0.0.1:${port}/?v=23`);
    addresses.forEach((address) => {
      console.log(`No iPhone: http://${address}:${port}/?v=23`);
    });
    console.log("");
    console.log("Deixe esta janela aberta enquanto estiver usando. Para parar, pressione Ctrl+C.");
  });
}

function getLocalAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((network) => network && network.family === "IPv4" && !network.internal)
    .map((network) => network.address);
}

createServer(START_PORT);
