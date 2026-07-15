import type { ClientSession, NetworkSession, ProjectSummary } from "@/stores/network";
import { useNetworkStore } from "@/stores/network";
import { useStore } from "@/stores/store";

export type ControlCommand =
	| "play"
	| "stop"
	| "scrollUp"
	| "scrollDown"
	| "jumpStart"
	| "jumpEnd"
	| "toggleDirection";

type WsHandler = (data: Record<string, unknown>) => void;

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let closingForReconnect = false;
let wsSessionReady = false;
let lastWsRole: "host" | "client" | "control" | undefined;
let lastWsProjectId: string | undefined;
const wsQueue: Record<string, unknown>[] = [];
const wsHandlers = new Map<string, WsHandler[]>();

function getApiBase() {
	const config = useRuntimeConfig();
	const network = useNetworkStore();
	const url = network.serverUrl || (config.public.apiBase as string) || "";
	return url.replace(/\/$/, "");
}

function getWsUrl() {
	const apiBase = getApiBase();
	if (!apiBase && import.meta.client) {
		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		return `${protocol}//${window.location.host}/ws`;
	}
	if (!apiBase) return "";
	const url = new URL(apiBase);
	url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
	url.pathname = "/ws";
	return url.toString();
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const network = useNetworkStore();
	const base = getApiBase();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(options.headers as Record<string, string> ?? {})
	};
	if (network.instanceId) {
		headers["X-Instance-Id"] = network.instanceId;
	}
	const url = base ? `${base}${path}` : path;
	const res = await fetch(url, { ...options, headers });
	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error((err as { error?: string }).error ?? res.statusText);
	}
	if (res.status === 204) return undefined as T;
	return res.json() as Promise<T>;
}

function dispatchWs(type: string, data: Record<string, unknown>) {
	const handlers = wsHandlers.get(type) ?? [];
	for (const handler of handlers) handler(data);
}

function flushWsQueue() {
	while (wsQueue.length > 0 && ws?.readyState === WebSocket.OPEN && wsSessionReady) {
		const message = wsQueue.shift()!;
		ws.send(JSON.stringify(message));
	}
}

function sendSessionJoin(role?: "host" | "client" | "control", projectId?: string) {
	const network = useNetworkStore();
	wsSessionReady = false;
	ws?.send(JSON.stringify({
		type: "session:join",
		instanceId: network.instanceId,
		instanceName: network.instanceName,
		projectId,
		role,
		userAgent: navigator.userAgent
	}));
}

function connectWebSocket(role?: "host" | "client" | "control", projectId?: string) {
	const network = useNetworkStore();
	const wsUrl = getWsUrl();
	if (!wsUrl || network.connectionMode === "local") return;

	lastWsRole = role;
	lastWsProjectId = projectId;

	if (ws?.readyState === WebSocket.OPEN) {
		sendSessionJoin(role, projectId);
		return;
	}

	if (ws?.readyState === WebSocket.CONNECTING) {
		closingForReconnect = true;
		ws.close();
	}

	wsSessionReady = false;
	ws = new WebSocket(wsUrl);

	ws.onopen = () => {
		network.setConnected(true);
		sendSessionJoin(role, projectId);
	};

	ws.onmessage = (event) => {
		try {
			const data = JSON.parse(event.data as string) as Record<string, unknown>;
			if (typeof data.type === "string") {
				if (data.type === "session:joined") {
					wsSessionReady = true;
					flushWsQueue();
				}
				dispatchWs(data.type, data);
				if (data.type === "clients:list" && Array.isArray(data.clients)) {
					network.setConnectedClients(data.clients as ClientSession[]);
				}
				if (data.type === "network:update" && Array.isArray(data.sessions)) {
					network.setNetworkSessions(data.sessions as NetworkSession[]);
				}
				if (data.type === "session:joined" && Array.isArray(data.clients)) {
					network.setConnectedClients(data.clients as ClientSession[]);
				}
				if (data.type === "session:kicked") {
					dispatchWs("session:kicked", data);
				}
			}
		} catch {}
	};

	ws.onclose = () => {
		network.setConnected(false);
		if (closingForReconnect) {
			closingForReconnect = false;
			return;
		}
		if (network.connectionMode === "remote") {
			reconnectTimer = setTimeout(() => connectWebSocket(lastWsRole, lastWsProjectId), 3000);
		}
	};

	ws.onerror = () => {
		network.setConnected(false);
	};
}

function disconnectWebSocket() {
	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}
	const network = useNetworkStore();
	if (ws?.readyState === WebSocket.OPEN && network.projectId) {
		ws.send(JSON.stringify({
			type: "session:leave",
			instanceId: network.instanceId,
			projectId: network.projectId
		}));
	}
	closingForReconnect = true;
	ws?.close();
	ws = null;
	wsSessionReady = false;
	wsQueue.length = 0;
	network.setConnected(false);
}

function sendWs(message: Record<string, unknown>) {
	if (message.type === "session:join") return;
	if (ws?.readyState === WebSocket.OPEN && wsSessionReady) {
		ws.send(JSON.stringify(message));
	} else {
		wsQueue.push(message);
	}
}

export function useTelecatServer() {
	const network = useNetworkStore();

	function initServerUrl() {
		const config = useRuntimeConfig();
		network.loadServerUrlFromStorage(config.public.apiBase as string);
	}

	async function fetchProjects() {
		const projects = await apiFetch<ProjectSummary[]>("/api/projects");
		network.setProjects(projects);
		return projects;
	}

	async function fetchNetworkSessions() {
		const sessions = await apiFetch<NetworkSession[]>("/api/network/sessions");
		network.setNetworkSessions(sessions);
		return sessions;
	}

	async function kickSession(sessionId: string) {
		await apiFetch(`/api/network/sessions/${sessionId}`, { method: "DELETE" });
		await Promise.all([fetchNetworkSessions(), fetchProjects()]);
	}

	async function createProject(name?: string, data?: Record<string, unknown>) {
		return apiFetch<{ id: string; name: string; data: string }>("/api/projects", {
			method: "POST",
			body: JSON.stringify({ name, data })
		});
	}

	async function getProject(id: string) {
		return apiFetch<{ id: string; name: string; data: string }>(`/api/projects/${id}`);
	}

	async function saveProject(id: string, data: Record<string, unknown>, name?: string) {
		return apiFetch(`/api/projects/${id}`, {
			method: "PATCH",
			body: JSON.stringify({ data, name })
		});
	}

	async function openProject(id: string, requestedRole?: "host" | "client") {
		const base = getApiBase();
		const headers: Record<string, string> = {
			"Content-Type": "application/json"
		};
		if (network.instanceId) {
			headers["X-Instance-Id"] = network.instanceId;
		}
		const url = base ? `${base}/api/projects/${id}/open` : `/api/projects/${id}/open`;
		const res = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify({
				instanceId: network.instanceId,
				instanceName: network.instanceName,
				requestedRole
			})
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({ error: res.statusText }));
			const error = new Error((err as { error?: string }).error ?? res.statusText) as Error & {
				status?: number;
				canJoinAsClient?: boolean;
				existingHost?: string;
			};
			error.status = res.status;
			if (typeof err === "object" && err !== null) {
				error.canJoinAsClient = (err as { canJoinAsClient?: boolean }).canJoinAsClient;
				error.existingHost = (err as { existingHost?: string }).existingHost;
			}
			throw error;
		}
		const result = await res.json() as {
			projectId: string;
			sessionId: string;
			role: "host" | "client";
			project: { id: string; name: string; data: string };
			sessions: NetworkSession[];
		};
		network.setProjectContext(id, result.role);
		network.setNetworkSessions(result.sessions);
		connectWebSocket(result.role, id);
		return result;
	}

	async function deleteProject(id: string) {
		await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
		network.setProjects(network.projects.filter(p => p.id !== id));
	}

	function joinSession(role: "host" | "client" | "control", projectId?: string) {
		connectWebSocket(role, projectId);
	}

	function leaveSession() {
		disconnectWebSocket();
		network.setProjectContext(null, null);
	}

	async function goToDashboard() {
		const store = useStore();
		if (network.projectId && network.connectionMode === "remote") {
			leaveSession();
		}
		store.setClientMode(false);
		store.setSettingsClosed();
		await navigateTo("/");
	}

	function broadcastState(projectId: string, payload: Record<string, unknown>) {
		if (network.connectionMode === "local") return;

		if (lastWsRole !== "host" || lastWsProjectId !== projectId) {
			connectWebSocket("host", projectId);
		}

		sendWs({
			type: "state:sync",
			projectId,
			instanceId: network.instanceId,
			payload
		});
	}

	function sendControlStyle(
		payload: Record<string, unknown>,
		options?: { projectId?: string; targetInstanceId?: string }
	) {
		if (!options?.targetInstanceId) return;
		sendWs({
			type: "control:style",
			payload,
			projectId: options?.projectId,
			targetInstanceId: options.targetInstanceId
		});
	}

	function sendControlCommand(
		command: ControlCommand,
		options: { projectId: string; targetInstanceId: string }
	) {
		sendWs({
			type: "control:command",
			command,
			projectId: options.projectId,
			targetInstanceId: options.targetInstanceId
		});
	}

	function requestClientsList(projectId?: string) {
		sendWs({ type: "clients:list", projectId });
	}

	async function renameProject(id: string, name: string) {
		await apiFetch(`/api/projects/${id}`, {
			method: "PATCH",
			body: JSON.stringify({ name })
		});
		network.setProjects(network.projects.map(p => p.id === id ? { ...p, name } : p));
	}

	function requestClientState(targetInstanceId: string) {
		sendWs({ type: "client:state:request", targetInstanceId });
	}

	function sendClientStateResponse(payload: {
		instanceId: string;
		projectId: string;
		payload: Record<string, unknown>;
	}) {
		sendWs({
			type: "client:state:response",
			...payload
		});
	}

	function sendSwitchProject(targetInstanceId: string, projectId: string) {
		sendWs({
			type: "control:switchProject",
			targetInstanceId,
			projectId
		});
	}

	function onSessionJoined(handler: WsHandler) {
		onWsMessage("session:joined", handler);
	}

	function onWsMessage(type: string, handler: WsHandler) {
		const list = wsHandlers.get(type) ?? [];
		list.push(handler);
		wsHandlers.set(type, list);
		onUnmounted(() => {
			const handlers = wsHandlers.get(type) ?? [];
			wsHandlers.set(type, handlers.filter(h => h !== handler));
		});
	}

	return {
		initServerUrl,
		fetchProjects,
		fetchNetworkSessions,
		kickSession,
		createProject,
		getProject,
		saveProject,
		openProject,
		deleteProject,
		joinSession,
		leaveSession,
		goToDashboard,
		broadcastState,
		sendControlCommand,
		sendControlStyle,
		requestClientsList,
		renameProject,
		requestClientState,
		sendClientStateResponse,
		sendSwitchProject,
		onSessionJoined,
		onWsMessage,
		connectWebSocket,
		disconnectWebSocket
	};
}
