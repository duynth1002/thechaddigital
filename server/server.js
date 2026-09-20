const http = require("http");
const { Server } = require("socket.io");
const { Building } = require("./src/models/Building");
const { SimulationEngine } = require("./src/services/SimulationEngine");
const { attachSocket } = require("./src/ws/socket");
const { DEFAULT_CONFIG } = require("./src/config");

const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const building = new Building();
const engine = new SimulationEngine(building, { tickMs: DEFAULT_CONFIG.tickMs });

const httpServer = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader("Access-Control-Allow-Origin", CLIENT_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    json(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/state") {
    json(res, 200, building.getSnapshot());
    return;
  }

  json(res, 404, { error: "Not found" });
});

const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN },
});

attachSocket(io, building);
engine.onTick((snapshot) => io.emit("state", snapshot));
engine.start();

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Elevator simulator listening on http://localhost:${PORT}`);
});

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}
