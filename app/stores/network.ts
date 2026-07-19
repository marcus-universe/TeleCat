import { acceptHMRUpdate, defineStore } from "pinia";

export interface ClientSession {
	sessionId: string;
	projectId: string;
	projectName: string;
	instanceId: string;
	instanceName: string;
	role: string;
	openedAt: string;
	online?: boolean;
}

export interface NetworkSession {
	id: string;
	project_id: string;
	instance_id: string;
	role: string;
	opened_at: string;
	instance_name: string;
	project_name: string;
	ip_address?: string | null;
}

export interface ProjectSummary {
	id: string;
	name: string;
	updated_at: string;
	created_at: string;
	host_role: string | null;
	session_count: number;
}

const TAB_INSTANCE_KEY = "telecat-tab-instance-id";

function getOrCreateInstanceId() {
	if (import.meta.client) {
		let id = sessionStorage.getItem(TAB_INSTANCE_KEY);
		if (!id) {
			id = crypto.randomUUID();
			sessionStorage.setItem(TAB_INSTANCE_KEY, id);
		}
		return id;
	}
	return "";
}

function getInstanceName() {
	if (!import.meta.client) return "Browser";
	const id = getOrCreateInstanceId();
	const short = id.slice(0, 8);
	if (navigator.userAgent.includes("Tauri")) {
		return `Tauri (${short})`;
	}
	return `Browser (${short})`;
}

export const useNetworkStore = defineStore("network", {
	state: () => ({
		connectionMode: "remote" as "local" | "remote",
		serverUrl: "",
		instanceId: getOrCreateInstanceId(),
		instanceName: getInstanceName(),
		projectId: null as string | null,
		projectRole: null as "host" | "client" | null,
		connected: false,
		projects: [] as ProjectSummary[],
		networkSessions: [] as NetworkSession[],
		connectedClients: [] as ClientSession[],
		serverUrlInput: ""
	}),
	actions: {
		setConnectionMode(mode: "local" | "remote") {
			this.connectionMode = mode;
		},
		setServerUrl(url: string) {
			this.serverUrl = url.replace(/\/$/, "");
			if (import.meta.client) {
				localStorage.setItem("telecat-server-url", this.serverUrl);
			}
		},
		loadServerUrlFromStorage(fallback: string) {
			if (import.meta.client) {
				const stored = localStorage.getItem("telecat-server-url");
				this.serverUrl = (stored || fallback).replace(/\/$/, "");
				this.serverUrlInput = this.serverUrl;
			} else {
				this.serverUrl = fallback.replace(/\/$/, "");
			}
		},
		setProjectContext(projectId: string | null, role: "host" | "client" | null) {
			this.projectId = projectId;
			this.projectRole = role;
		},
		setConnected(value: boolean) {
			this.connected = value;
		},
		setProjects(projects: ProjectSummary[]) {
			this.projects = projects;
		},
		setNetworkSessions(sessions: NetworkSession[]) {
			this.networkSessions = sessions;
		},
		setConnectedClients(clients: ClientSession[]) {
			this.connectedClients = clients;
		},
		setInstanceName(name: string) {
			this.instanceName = name;
		}
	}
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useNetworkStore, import.meta.hot));
}
