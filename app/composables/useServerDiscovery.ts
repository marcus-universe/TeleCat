export interface DiscoveredServer {
	url: string;
	name: string;
	label: string;
}

export const DEFAULT_SCAN_PORT = 4000;
export const CUSTOM_SERVER_OPTION = "__custom__";

const KNOWN_SERVERS_KEY = "telecat-known-servers";
const SCAN_PORT_KEY = "telecat-scan-port";

function getStoredServers(): string[] {
	if (!import.meta.client) return [];
	try {
		const raw = localStorage.getItem(KNOWN_SERVERS_KEY);
		return raw ? JSON.parse(raw) as string[] : [];
	} catch {
		return [];
	}
}

function storeServer(url: string) {
	if (!import.meta.client) return;
	const stored = getStoredServers().filter(u => u !== url);
	stored.unshift(url);
	localStorage.setItem(KNOWN_SERVERS_KEY, JSON.stringify(stored.slice(0, 10)));
}

function loadScanPort(): number {
	if (!import.meta.client) return DEFAULT_SCAN_PORT;
	const stored = localStorage.getItem(SCAN_PORT_KEY);
	const port = stored ? Number(stored) : DEFAULT_SCAN_PORT;
	if (!Number.isInteger(port) || port < 1 || port > 65535) return DEFAULT_SCAN_PORT;
	return port;
}

function normalizeApiUrl(url: string, defaultPort = DEFAULT_SCAN_PORT): string {
	const trimmed = url.trim().replace(/\/$/, "");
	if (!trimmed) return "";

	try {
		const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
		const parsed = new URL(withProtocol);
		if (!parsed.port) {
			parsed.port = String(defaultPort);
		}
		return parsed.origin;
	} catch {
		return trimmed;
	}
}

function isTelecatDiscoverResponse(data: unknown): data is { name: string; version?: string; host?: string } {
	return typeof data === "object"
		&& data !== null
		&& "name" in data
		&& (data as { name: unknown }).name === "TeleCat";
}

export async function probeServer(baseUrl: string, timeoutMs = 800): Promise<DiscoveredServer | null> {
	const url = baseUrl.replace(/\/$/, "");
	if (!url) return null;

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(`${url}/api/discover`, { signal: controller.signal });
		if (!res.ok) return null;
		const data = await res.json();
		if (!isTelecatDiscoverResponse(data)) return null;

		return {
			url,
			name: data.name,
			label: `${data.name} (${url})`
		};
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
	}
}

function parsePrivateIpv4(hostname: string): [number, number, number, number] | null {
	if (!/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null;
	const parts = hostname.split(".").map(Number);
	if (parts.some(n => Number.isNaN(n) || n < 0 || n > 255)) return null;
	return parts as [number, number, number, number];
}

function isPrivateIpv4(parts: [number, number, number, number]): boolean {
	const [a, b] = parts;
	return a === 10
		|| (a === 172 && b >= 16 && b <= 31)
		|| (a === 192 && b === 168);
}

function buildHostRange(base: string, from: number, to: number): string[] {
	const hosts: string[] = [];
	for (let host = from; host <= to; host++) {
		hosts.push(`${base}.${host}`);
	}
	return hosts;
}

function getVlanSubnetBases(parts: [number, number, number, number]): string[] {
	const [a, b, c] = parts;
	const bases: string[] = [];
	for (let offset = -8; offset <= 8; offset++) {
		const third = c + offset;
		if (third < 0 || third > 255 || third === c) continue;
		bases.push(`${a}.${b}.${third}`);
	}
	return bases;
}

function getStaticCandidates(port: number): string[] {
	const candidates = new Set<string>([
		`http://localhost:${port}`,
		`http://127.0.0.1:${port}`
	]);

	for (const stored of getStoredServers()) {
		candidates.add(stored.replace(/\/$/, ""));
	}

	return [...candidates];
}

function getNetworkScanHosts(): { fullSubnet: string[]; vlanSubnets: string[] } {
	if (!import.meta.client) return { fullSubnet: [], vlanSubnets: [] };

	const parts = parsePrivateIpv4(window.location.hostname);
	if (!parts || !isPrivateIpv4(parts)) return { fullSubnet: [], vlanSubnets: [] };

	const [a, b, c] = parts;
	const currentBase = `${a}.${b}.${c}`;
	const fullSubnet = buildHostRange(currentBase, 1, 254);
	const vlanSubnets: string[] = [];

	for (const base of getVlanSubnetBases(parts)) {
		vlanSubnets.push(...buildHostRange(base, 1, 50));
		vlanSubnets.push(...buildHostRange(base, 200, 254));
	}

	return { fullSubnet, vlanSubnets };
}

async function probeHosts(
	hosts: string[],
	port: number,
	found: Map<string, DiscoveredServer>,
	timeoutMs = 600,
	batchSize = 40
) {
	for (let i = 0; i < hosts.length; i += batchSize) {
		const batch = hosts.slice(i, i + batchSize);
		const results = await Promise.all(
			batch.map(host => probeServer(`http://${host}:${port}`, timeoutMs))
		);
		for (const result of results) {
			if (result) found.set(result.url, result);
		}
	}
}

export function useServerDiscovery() {
	const servers = ref<DiscoveredServer[]>([]);
	const scanning = ref(false);
	const scanPort = ref(loadScanPort());

	function setScanPort(port: number) {
		const normalized = Math.min(65535, Math.max(1, Math.floor(port) || DEFAULT_SCAN_PORT));
		scanPort.value = normalized;
		if (import.meta.client) {
			localStorage.setItem(SCAN_PORT_KEY, String(normalized));
		}
	}

	async function scanServers() {
		if (!import.meta.client) return [];

		scanning.value = true;
		const found = new Map<string, DiscoveredServer>();
		const port = scanPort.value;

		try {
			const staticResults = await Promise.all(getStaticCandidates(port).map(url => probeServer(url)));
			for (const result of staticResults) {
				if (result) found.set(result.url, result);
			}

			const { fullSubnet, vlanSubnets } = getNetworkScanHosts();
			await probeHosts(fullSubnet, port, found);
			await probeHosts(vlanSubnets, port, found, 500, 50);

			servers.value = [...found.values()].sort((a, b) => a.label.localeCompare(b.label));
		} finally {
			scanning.value = false;
		}

		return servers.value;
	}

	async function validateServerUrl(url: string): Promise<DiscoveredServer | null> {
		const normalized = normalizeApiUrl(url, scanPort.value);
		if (!normalized) return null;
		return probeServer(normalized, 1500);
	}

	function selectServer(url: string) {
		if (url) storeServer(url);
	}

	return { servers, scanning, scanPort, setScanPort, scanServers, validateServerUrl, selectServer };
}
