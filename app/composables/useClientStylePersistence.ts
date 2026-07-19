import type { ClientStyleModel } from "~/components/Layout/ControlClientStyling.vue";

const CLIENT_OVERRIDES_PREFIX = "telecat-client-overrides";
const CONTROL_STYLE_PREFIX = "telecat-control-client-style";

function clientOverridesKey(projectId: string, instanceId: string) {
	return `${CLIENT_OVERRIDES_PREFIX}:${projectId}:${instanceId}`;
}

function controlStyleKey(instanceId: string) {
	return `${CONTROL_STYLE_PREFIX}:${instanceId}`;
}

export function loadPersistedClientOverrides(
	projectId: string,
	instanceId: string
): Record<string, unknown> | null {
	if (!import.meta.client) return null;
	try {
		const raw = localStorage.getItem(clientOverridesKey(projectId, instanceId));
		if (!raw) return null;
		const parsed = JSON.parse(raw) as unknown;
		return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
	} catch {
		return null;
	}
}

export function persistClientOverrides(
	projectId: string,
	instanceId: string,
	overrides: Record<string, unknown>
) {
	if (!import.meta.client) return;
	localStorage.setItem(clientOverridesKey(projectId, instanceId), JSON.stringify(overrides));
}

export function loadControlClientStyle(instanceId: string): Partial<ClientStyleModel> | null {
	if (!import.meta.client) return null;
	try {
		const raw = localStorage.getItem(controlStyleKey(instanceId));
		if (!raw) return null;
		const parsed = JSON.parse(raw) as unknown;
		return parsed && typeof parsed === "object" ? parsed as Partial<ClientStyleModel> : null;
	} catch {
		return null;
	}
}

export function persistControlClientStyle(instanceId: string, style: ClientStyleModel) {
	if (!import.meta.client) return;
	localStorage.setItem(controlStyleKey(instanceId), JSON.stringify(style));
}
