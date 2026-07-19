import http from "node:http";
import express from "express";
import { runMigrations } from "./db/migrations.js";
import { closeDb } from "./db/client.js";
import { registerNetworkRoutes } from "./routes/network.js";
import { registerProjectRoutes } from "./routes/projects.js";
import { getNetworkSessions, removeStaleSessions, setupWebSocket } from "./ws/handler.js";

const PORT = Number(process.env.TELECAT_PORT ?? 4000);

runMigrations();

const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: "10mb" }));
app.use((_req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type, X-Instance-Id");
	if (_req.method === "OPTIONS") {
		res.sendStatus(204);
		return;
	}
	next();
});

registerProjectRoutes(app);
registerNetworkRoutes(app);
setupWebSocket(app, server);

app.get("/", (_req, res) => {
	res.json({
		name: "TeleCat API",
		status: "ok",
		health: "/api/health",
		discover: "/api/discover",
		websocket: "/ws",
		hint: "Use the Nuxt app (e.g. http://localhost:3000/TeleCat/) for the UI. This port serves the REST/WebSocket API."
	});
});

setInterval(() => removeStaleSessions(120), 60_000);

server.listen(PORT, "0.0.0.0", () => {
	console.log(`TeleCat server running on http://0.0.0.0:${PORT}`);
	console.log(`Database: ${process.env.TELECAT_DB_PATH ?? "./data/sb.sqlite"}`);
});

function shutdown() {
	closeDb();
	server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
