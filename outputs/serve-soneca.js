const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.join(__dirname, "nap-pwa");
const HOST = "0.0.0.0";
const START_PORT = Number(process.env.PORT || 5179);
const APP_VERSION = getAppVersion();
const PUSH_DIR = path.join(__dirname, ".soneca-push");
const VAPID_FILE = path.join(PUSH_DIR, "vapid.json");
const SUBSCRIPTIONS_FILE = path.join(PUSH_DIR, "subscriptions.json");
const SCHEDULES_FILE = path.join(PUSH_DIR, "schedules.json");
let webpush = null;
try {
  webpush = require("web-push");
} catch {
  webpush = null;
}
const vapidKeys = loadVapidKeys();
let pushSubscriptions = loadJson(SUBSCRIPTIONS_FILE, []);
let pushSchedules = loadJson(SCHEDULES_FILE, []);
const pushTimers = new Map();

if (webpush && vapidKeys) {
  webpush.setVapidDetails("mailto:soneca@local.app", vapidKeys.publicKey, vapidKeys.privateKey);
}

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

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload), "application/json; charset=utf-8");
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
    const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (parsedUrl.pathname.startsWith("/api/push/")) {
      handlePushApi(req, res, parsedUrl);
      return;
    }

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
    console.log(`Neste computador: http://127.0.0.1:${port}/?v=${APP_VERSION}`);
    addresses.forEach((address) => {
      console.log(`No iPhone: http://${address}:${port}/?v=${APP_VERSION}`);
    });
    console.log("");
    console.log("Deixe esta janela aberta enquanto estiver usando. Para parar, pressione Ctrl+C.");
  });
}

function handlePushApi(req, res, parsedUrl) {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (!webpush || !vapidKeys) {
    sendJson(res, 503, {
      ok: false,
      error: "Dependencia web-push ausente. Execute npm install na pasta outputs e reinicie a BAT."
    });
    return;
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/push/public-key") {
    sendJson(res, 200, { ok: true, publicKey: vapidKeys.publicKey });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Metodo nao permitido." });
    return;
  }

  readJsonBody(req)
    .then((body) => {
      if (parsedUrl.pathname === "/api/push/subscribe") {
        saveSubscription(body.subscription || body);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (parsedUrl.pathname === "/api/push/schedule") {
        const subscription = body.subscription;
        saveSubscription(subscription);
        saveSchedules(subscription.endpoint, body.reminders || []);
        sendJson(res, 200, { ok: true, scheduled: pushSchedules.filter((item) => item.endpoint === subscription.endpoint).length });
        return;
      }

      if (parsedUrl.pathname === "/api/push/test") {
        sendRemotePush(body.subscription, {
          title: "Avisos remotos ativos",
          body: "Este aviso saiu do servidor local da Soneca.",
          tag: "soneca-push-teste"
        }).then(() => sendJson(res, 200, { ok: true }))
          .catch((error) => sendJson(res, 500, { ok: false, error: error.message }));
        return;
      }

      sendJson(res, 404, { ok: false, error: "Endpoint nao encontrado." });
    })
    .catch((error) => sendJson(res, 400, { ok: false, error: error.message }));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        req.destroy();
        reject(new Error("Corpo muito grande."));
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("JSON invalido."));
      }
    });
    req.on("error", reject);
  });
}

function saveSubscription(subscription) {
  if (!subscription || !subscription.endpoint) {
    throw new Error("Assinatura push invalida.");
  }

  pushSubscriptions = pushSubscriptions.filter((item) => item.endpoint !== subscription.endpoint);
  pushSubscriptions.push({ ...subscription, updatedAt: new Date().toISOString() });
  writeJson(SUBSCRIPTIONS_FILE, pushSubscriptions);
}

function saveSchedules(endpoint, reminders) {
  if (!endpoint) throw new Error("Endpoint push ausente.");
  const now = Date.now();
  const maxFuture = now + 48 * 60 * 60 * 1000;
  pushSchedules = pushSchedules.filter((item) => item.endpoint !== endpoint);

  reminders.forEach((reminder) => {
    const at = new Date(reminder.at).getTime();
    if (!Number.isFinite(at) || at < now - 60 * 1000 || at > maxFuture) return;
    pushSchedules.push({
      id: reminder.id || `${endpoint}-${at}-${reminder.tag || "soneca"}`,
      endpoint,
      at,
      title: reminder.title || "Soneca",
      body: reminder.body || "",
      tag: reminder.tag || "soneca-alerta"
    });
  });

  writeJson(SCHEDULES_FILE, pushSchedules);
  scheduleRemotePushTimers();
}

function scheduleRemotePushTimers() {
  pushTimers.forEach((timer) => clearTimeout(timer));
  pushTimers.clear();
  const now = Date.now();

  pushSchedules.forEach((reminder) => {
    const delay = reminder.at - now;
    if (delay < -60 * 1000) return;
    const timer = setTimeout(() => {
      const subscription = pushSubscriptions.find((item) => item.endpoint === reminder.endpoint);
      if (!subscription) return removeSchedule(reminder.id);
      sendRemotePush(subscription, reminder)
        .catch((error) => {
          if (error.statusCode === 404 || error.statusCode === 410) {
            removeSubscription(reminder.endpoint);
          } else {
            console.error(`Falha ao enviar push: ${error.message}`);
          }
        })
        .finally(() => removeSchedule(reminder.id));
    }, Math.max(0, delay));
    pushTimers.set(reminder.id, timer);
  });
}

function sendRemotePush(subscription, reminder) {
  return webpush.sendNotification(subscription, JSON.stringify({
    title: reminder.title,
    body: reminder.body,
    tag: reminder.tag || "soneca-alerta"
  }));
}

function removeSchedule(id) {
  const timer = pushTimers.get(id);
  if (timer) clearTimeout(timer);
  pushTimers.delete(id);
  pushSchedules = pushSchedules.filter((item) => item.id !== id);
  writeJson(SCHEDULES_FILE, pushSchedules);
}

function removeSubscription(endpoint) {
  pushSubscriptions = pushSubscriptions.filter((item) => item.endpoint !== endpoint);
  pushSchedules = pushSchedules.filter((item) => item.endpoint !== endpoint);
  writeJson(SUBSCRIPTIONS_FILE, pushSubscriptions);
  writeJson(SCHEDULES_FILE, pushSchedules);
  scheduleRemotePushTimers();
}

function loadVapidKeys() {
  if (!webpush) return null;
  ensurePushDir();
  const loaded = loadJson(VAPID_FILE, null);
  if (loaded && loaded.publicKey && loaded.privateKey) return loaded;

  const generated = webpush.generateVAPIDKeys();
  writeJson(VAPID_FILE, generated);
  return generated;
}

function loadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensurePushDir();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function ensurePushDir() {
  fs.mkdirSync(PUSH_DIR, { recursive: true });
}

function getLocalAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((network) => network && network.family === "IPv4" && !network.internal)
    .map((network) => network.address);
}

function getAppVersion() {
  try {
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    const match = html.match(/app\.js\?v=(\d+)/);
    return match ? match[1] : "1";
  } catch {
    return "1";
  }
}

scheduleRemotePushTimers();
createServer(START_PORT);
