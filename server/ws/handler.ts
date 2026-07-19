import type { Server } from "node:http";
import { randomUUID } from "node:crypto";
import type { Application, Request } from "express";
import expressWs from "express-ws";
import type WebSocket from "ws";
import { WebSocket as WsWebSocket } from "ws";
import { dbAll, dbGet, dbRun } from "../db/client.js";
import {
	clientsListRequestSchema,
	clientStateRequestSchema,
	clientStateResponseSchema,
	controlCommandSchema,
	controlStyleSchema,
	controlSwitchProjectSchema,
	sessionJoinSchema,
	sessionLeaveSchema,
	stateSyncSchema,
	wsMessageSchema
} from "./messages.js";

interface ConnectedClient {
	connectionId: string;
	ws: WebSocket;
	instanceId: string;
	instanceName: string;
	projectId?: string;
	role?: "host" | "client" | "control";
	ip?: string;
}

const connections = new Map<string, ConnectedClient>();
const wsToConnectionId = new WeakMap<WebSocket, string>();
const wsToIp = new WeakMap<WebSocket, string>();
const pendingStateRequests = new Map<string, WebSocket>();

function getClientIp(req: Request): string {
	const forwarded = req.headers["x-forwarded-for"];
	if (typeof forwarded === "string") {
		return forwarded.split(",")[0]?.trim() ?? "";
	}
	if (Array.isArray(forwarded) && forwarded[0]) {
		return forwarded[0].split(",")[0]?.trim() ?? "";
	}
	const addr = req.socket.remoteAddress ?? "";
	return addr.replace(/^::ffff:/, "");
}

function getInstanceIp(instanceId: string): string | null {
	for (const conn of connections.values()) {
		if (conn.instanceId === instanceId && conn.ip) {
			return conn.ip;
		}
	}
	const row = dbGet<{ last_ip: string | null }>(
		`SELECT last_ip FROM instances WHERE id = ?`,
		[instanceId]
	);
	return row?.last_ip ?? null;
}

function getConnectionByWs(ws: WebSocket): ConnectedClient | undefined {
	const id = wsToConnectionId.get(ws);
	return id ? connections.get(id) : undefined;
}

function removeStaleConnections(instanceId: string, keepWs?: WebSocket) {
	for (const [connectionId, conn] of connections.entries()) {
		if (conn.instanceId !== instanceId) continue;
		if (keepWs && conn.ws === keepWs) continue;
		if (conn.ws.readyState === WsWebSocket.OPEN) {
			conn.ws.close();
		}
		connections.delete(connectionId);
		wsToConnectionId.delete(conn.ws);
	}
}

function isHostSender(sender: ConnectedClient | undefined, projectId: string): boolean {
	if (!sender) return false;
	if (sender.role === "host" && sender.projectId === projectId) return true;
	return getLiveHostInstanceId(projectId) === sender.instanceId;
}

function isInstanceOnline(instanceId: string): boolean {
	for (const conn of connections.values()) {
		if (conn.instanceId === instanceId && conn.ws.readyState === WsWebSocket.OPEN) {
			return true;
		}
	}
	return false;
}

export function getLiveHostInstanceId(projectId: string): string | null {
	for (const conn of connections.values()) {
		if (
			conn.role === "host" &&
			conn.projectId === projectId &&
			conn.ws.readyState === WsWebSocket.OPEN
		) {
			return conn.instanceId;
		}
	}
	return null;
}

function upsertInstance(instanceId: string, name: string, userAgent?: string, ip?: string) {
	dbRun(`
		INSERT INTO instances (id, name, user_agent, last_ip, last_seen)
		VALUES (?, ?, ?, ?, datetime('now'))
		ON CONFLICT(id) DO UPDATE SET
			name = excluded.name,
			user_agent = COALESCE(excluded.user_agent, instances.user_agent),
			last_ip = COALESCE(excluded.last_ip, instances.last_ip),
			last_seen = datetime('now')
	`, [instanceId, name, userAgent ?? null, ip ?? null]);
}

function touchInstance(instanceId: string, ip?: string) {
	if (ip) {
		dbRun(
			`UPDATE instances SET last_seen = datetime('now'), last_ip = ? WHERE id = ?`,
			[ip, instanceId]
		);
		return;
	}
	dbRun(`UPDATE instances SET last_seen = datetime('now') WHERE id = ?`, [instanceId]);
}

function upsertClientSession(instanceId: string, projectId: string, instanceName: string) {
	const existing = dbGet<{ id: string }>(
		`SELECT id FROM sessions WHERE project_id = ? AND instance_id = ? AND role = 'client'`,
		[projectId, instanceId]
	);
	if (existing) return;
	const sessionId = randomUUID();
	dbRun(`
		INSERT INTO sessions (id, project_id, instance_id, role, opened_at)
		VALUES (?, ?, ?, 'client', datetime('now'))
	`, [sessionId, projectId, instanceId]);
	upsertInstance(instanceId, instanceName);
}

function upsertHostSession(instanceId: string, projectId: string, instanceName: string) {
	dbRun(
		`DELETE FROM sessions WHERE project_id = ? AND role = 'host' AND instance_id != ?`,
		[projectId, instanceId]
	);
	const existing = dbGet<{ id: string }>(
		`SELECT id FROM sessions WHERE project_id = ? AND instance_id = ? AND role = 'host'`,
		[projectId, instanceId]
	);
	if (existing) return;
	const sessionId = randomUUID();
	dbRun(`
		INSERT INTO sessions (id, project_id, instance_id, role, opened_at)
		VALUES (?, ?, ?, 'host', datetime('now'))
	`, [sessionId, projectId, instanceId]);
	upsertInstance(instanceId, instanceName);
}

function broadcast(message: unknown, filter?: (client: ConnectedClient) => boolean) {
	const payload = JSON.stringify(message);
	for (const client of connections.values()) {
		if (filter && !filter(client)) continue;
		if (client.ws.readyState === WsWebSocket.OPEN) {
			client.ws.send(payload);
		}
	}
}

function broadcastNetworkUpdate() {
	broadcast({ type: "network:update", sessions: getNetworkSessions() });
}

function closeInstanceConnections(instanceId: string, message?: unknown) {
	for (const [connectionId, conn] of connections.entries()) {
		if (conn.instanceId !== instanceId) continue;
		if (message && conn.ws.readyState === WsWebSocket.OPEN) {
			conn.ws.send(JSON.stringify(message));
		}
		conn.ws.close();
		connections.delete(connectionId);
		wsToConnectionId.delete(conn.ws);
	}
}

function broadcastClientsList() {
	broadcast({
		type: "clients:list",
		clients: getClientsList()
	}, c => c.role === "control");
}

function sendToInstance(instanceId: string, message: unknown) {
	const payload = JSON.stringify(message);
	for (const client of connections.values()) {
		if (client.instanceId === instanceId && client.ws.readyState === WsWebSocket.OPEN) {
			client.ws.send(payload);
			return;
		}
	}
}

function getClientsList(projectId?: string) {
	const fromDb = dbAll<{
		session_id: string;
		project_id: string;
		instance_id: string;
		role: string;
		opened_at: string;
		instance_name: string;
		project_name: string;
	}>(`
		SELECT s.id as session_id, s.project_id, s.instance_id, s.role, s.opened_at,
		       i.name as instance_name, p.name as project_name
		FROM sessions s
		JOIN instances i ON i.id = s.instance_id
		JOIN projects p ON p.id = s.project_id
		WHERE s.role = 'client'
		${projectId ? "AND s.project_id = ?" : ""}
		ORDER BY s.opened_at DESC
	`, projectId ? [projectId] : []);

	const merged = new Map<string, {
		sessionId: string;
		projectId: string;
		projectName: string;
		instanceId: string;
		instanceName: string;
		role: string;
		openedAt: string;
		online: boolean;
	}>();

	for (const row of fromDb) {
		if (!isInstanceOnline(row.instance_id)) {
			continue;
		}
		merged.set(row.instance_id, {
			sessionId: row.session_id,
			projectId: row.project_id,
			projectName: row.project_name,
			instanceId: row.instance_id,
			instanceName: row.instance_name,
			role: row.role,
			openedAt: row.opened_at,
			online: true
		});
	}

	for (const conn of connections.values()) {
		if (conn.role !== "client") continue;
		if (projectId && conn.projectId !== projectId) continue;
		if (merged.has(conn.instanceId)) {
			merged.get(conn.instanceId)!.online = true;
			continue;
		}
		const projectName = conn.projectId
			? (dbGet<{ name: string }>(`SELECT name FROM projects WHERE id = ?`, [conn.projectId])?.name ?? conn.projectId)
			: "Unknown";
		merged.set(conn.instanceId, {
			sessionId: conn.connectionId,
			projectId: conn.projectId ?? "",
			projectName,
			instanceId: conn.instanceId,
			instanceName: conn.instanceName,
			role: "client",
			openedAt: new Date().toISOString(),
			online: true
		});
	}

	return [...merged.values()];
}

function handleMessage(ws: WebSocket, raw: string) {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
		return;
	}

	const result = wsMessageSchema.safeParse(parsed);
	if (!result.success) {
		ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
		return;
	}

	const message = result.data;

	switch (message.type) {
		case "session:join": {
			const data = sessionJoinSchema.parse(message);
			const ip = wsToIp.get(ws);
			removeStaleConnections(data.instanceId, ws);
			upsertInstance(data.instanceId, data.instanceName ?? data.instanceId, data.userAgent, ip);

			const existing = getConnectionByWs(ws);
			const connectionId = existing?.connectionId ?? randomUUID();
			const conn: ConnectedClient = {
				connectionId,
				ws,
				instanceId: data.instanceId,
				instanceName: data.instanceName ?? data.instanceId,
				projectId: data.projectId,
				role: data.role,
				ip
			};
			connections.set(connectionId, conn);
			wsToConnectionId.set(ws, connectionId);
			if (data.role === "host" && data.projectId) {
				upsertHostSession(data.instanceId, data.projectId, data.instanceName ?? data.instanceId);
			}
			if (data.role === "client" && data.projectId) {
				upsertClientSession(data.instanceId, data.projectId, data.instanceName ?? data.instanceId);
			}
			ws.send(JSON.stringify({
				type: "session:joined",
				instanceId: data.instanceId,
				clients: getClientsList(data.projectId)
			}));
			broadcast({ type: "network:update", sessions: getNetworkSessions() });
			if (data.role === "client" || data.role === "host") {
				broadcastClientsList();
			}
			if (data.role === "client" && data.projectId) {
				broadcast({
					type: "host:resync",
					projectId: data.projectId
				}, c => c.role === "host" && c.projectId === data.projectId);
			}
			break;
		}
		case "session:leave": {
			const data = sessionLeaveSchema.parse(message);
			const conn = getConnectionByWs(ws);
			if (data.projectId) {
				dbRun(`DELETE FROM sessions WHERE instance_id = ? AND project_id = ?`, [data.instanceId, data.projectId]);
			}
			if (conn) {
				connections.delete(conn.connectionId);
				wsToConnectionId.delete(ws);
			}
			broadcast({ type: "network:update", sessions: getNetworkSessions() });
			broadcastClientsList();
			break;
		}
		case "state:sync": {
			const data = stateSyncSchema.parse(message);
			const sender = getConnectionByWs(ws);
			if (!isHostSender(sender, data.projectId)) break;
			broadcast({
				type: "state:sync",
				projectId: data.projectId,
				payload: data.payload
			}, c => c.role === "client" && c.projectId === data.projectId);
			break;
		}
		case "control:command": {
			const data = controlCommandSchema.parse(message);
			if (data.sendToAll || !data.targetInstanceId) {
				broadcast({
					type: "control:command",
					projectId: data.projectId,
					command: data.command
				}, c => {
					if (c.role !== "client") return false;
					if (data.projectId && c.projectId !== data.projectId) return false;
					return true;
				});
			} else {
				sendToInstance(data.targetInstanceId, {
					type: "control:command",
					projectId: data.projectId,
					command: data.command
				});
			}
			break;
		}
		case "control:style": {
			const data = controlStyleSchema.parse(message);
			const styleMsg = {
				type: "control:style",
				projectId: data.projectId,
				payload: data.payload
			};
			if (data.sendToAll || !data.targetInstanceId) {
				broadcast(styleMsg, c => {
					if (c.role !== "client") return false;
					if (data.projectId && c.projectId !== data.projectId) return false;
					return true;
				});
			} else {
				sendToInstance(data.targetInstanceId, styleMsg);
			}
			break;
		}
		case "clients:list": {
			const data = clientsListRequestSchema.parse(message);
			ws.send(JSON.stringify({
				type: "clients:list",
				clients: getClientsList(data.projectId)
			}));
			break;
		}
		case "control:switchProject": {
			const data = controlSwitchProjectSchema.parse(message);
			sendToInstance(data.targetInstanceId, {
				type: "control:switchProject",
				projectId: data.projectId
			});
			break;
		}
		case "client:state:request": {
			const data = clientStateRequestSchema.parse(message);
			pendingStateRequests.set(data.targetInstanceId, ws);
			sendToInstance(data.targetInstanceId, { type: "client:state:request" });
			break;
		}
		case "client:state:response": {
			const data = clientStateResponseSchema.parse(message);
			const requester = pendingStateRequests.get(data.instanceId);
			if (requester?.readyState === WsWebSocket.OPEN) {
				requester.send(JSON.stringify(data));
			}
			pendingStateRequests.delete(data.instanceId);
			break;
		}
	}
}

export function getNetworkSessions() {
	const active: Array<{
		id: string;
		project_id: string;
		instance_id: string;
		role: string;
		opened_at: string;
		instance_name: string;
		project_name: string;
		ip_address: string | null;
	}> = [];

	const seen = new Set<string>();

	for (const conn of connections.values()) {
		if (conn.role !== "host" && conn.role !== "client") continue;
		if (!conn.projectId || conn.ws.readyState !== WsWebSocket.OPEN) continue;

		const trackKey = `${conn.instanceId}:${conn.projectId}:${conn.role}`;
		if (seen.has(trackKey)) continue;
		seen.add(trackKey);

		if (conn.role === "host") {
			upsertHostSession(conn.instanceId, conn.projectId, conn.instanceName);
		} else {
			upsertClientSession(conn.instanceId, conn.projectId, conn.instanceName);
		}

		const row = dbGet<{
			id: string;
			project_id: string;
			instance_id: string;
			role: string;
			opened_at: string;
			instance_name: string;
			project_name: string;
		}>(`
			SELECT s.id, s.project_id, s.instance_id, s.role, s.opened_at,
			       i.name as instance_name, p.name as project_name
			FROM sessions s
			JOIN instances i ON i.id = s.instance_id
			JOIN projects p ON p.id = s.project_id
			WHERE s.instance_id = ? AND s.project_id = ? AND s.role = ?
			LIMIT 1
		`, [conn.instanceId, conn.projectId, conn.role]);

		if (row) {
			active.push({
				...row,
				ip_address: getInstanceIp(conn.instanceId)
			});
			continue;
		}

		const projectName = dbGet<{ name: string }>(
			`SELECT name FROM projects WHERE id = ?`,
			[conn.projectId]
		)?.name ?? conn.projectId;

		active.push({
			id: conn.connectionId,
			project_id: conn.projectId,
			instance_id: conn.instanceId,
			role: conn.role,
			opened_at: new Date().toISOString(),
			instance_name: conn.instanceName,
			project_name: projectName,
			ip_address: getInstanceIp(conn.instanceId)
		});
	}

	return active.sort((a, b) => b.opened_at.localeCompare(a.opened_at));
}

export function kickSession(sessionId: string): boolean {
	const session = dbGet<{ id: string; instance_id: string }>(
		`SELECT id, instance_id FROM sessions WHERE id = ?`,
		[sessionId]
	);
	if (!session) return false;

	dbRun(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
	closeInstanceConnections(session.instance_id, { type: "session:kicked" });
	broadcastNetworkUpdate();
	broadcastClientsList();
	return true;
}

export function setupWebSocket(app: Application, server: Server) {
	expressWs(app, server);

	app.ws("/ws", (ws, req) => {
		const clientIp = getClientIp(req);
		if (clientIp) {
			wsToIp.set(ws, clientIp);
		}

		ws.on("message", (data) => {
			const raw = typeof data === "string" ? data : data.toString("utf8");
			handleMessage(ws, raw);
			const conn = getConnectionByWs(ws);
			if (conn) touchInstance(conn.instanceId, conn.ip ?? wsToIp.get(ws));
		});

		ws.on("close", () => {
			wsToIp.delete(ws);
			const conn = getConnectionByWs(ws);
			if (conn?.projectId) {
				dbRun(
					`DELETE FROM sessions WHERE instance_id = ? AND project_id = ? AND role = ?`,
					[conn.instanceId, conn.projectId, conn.role ?? "client"]
				);
			}
			if (conn) {
				connections.delete(conn.connectionId);
				wsToConnectionId.delete(ws);
			}
			broadcastNetworkUpdate();
			broadcastClientsList();
		});
	});
}

export function removeStaleSessions(maxAgeMinutes = 60) {
	const rows = dbAll<{ id: string; instance_id: string }>(
		`SELECT id, instance_id FROM sessions WHERE opened_at < datetime('now', ?)`,
		[`-${maxAgeMinutes} minutes`]
	);
	for (const row of rows) {
		if (!isInstanceOnline(row.instance_id)) {
			dbRun(`DELETE FROM sessions WHERE id = ?`, [row.id]);
		}
	}
}
