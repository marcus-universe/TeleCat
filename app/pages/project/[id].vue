<template>
	<div class="teleprommt_wrapper">
		<div v-if="previewState === true" class="directionArrow" :class="{ up: direction }">
			<DesignIcons icon="scrollarrow" customclass="scrollarrow" />
		</div>
		<div v-if="isClientMode" class="client-mode-banner">
			{{ t("roleDialog.clientBanner") }}
		</div>
		<MarkdownEditor />
	</div>
</template>

<script lang="ts" setup>
	import { useNetworkStore } from "@/stores/network";
	import { useStore } from "@/stores/store";
	import { applyThemeFromStore } from "@/composables/applyThemeFromStore";
	import { loadPersistedClientOverrides } from "@/composables/useClientStylePersistence";

	definePageMeta({ layout: "home" });

	const { t } = useI18n();
	const route = useRoute();
	const router = useRouter();
	const store = useStore();
	const network = useNetworkStore();
	const {
		openProject,
		getProject,
		saveProject,
		broadcastState,
		onWsMessage,
		onSessionJoined,
		leaveSession,
		goToDashboard,
		sendClientStateResponse
	} = useTelecatServer();
	const { handleControlCommand } = useScrollEngine();

	const previewState = computed(() => store.previewState);
	const direction = computed(() => store.settings.direction);
	const isClientMode = computed(() => store.isClientMode);
	const isHost = computed(() => !isLocal.value && network.projectRole === "host");

	const projectId = computed(() => route.params.id as string);
	const isLocal = computed(() => projectId.value === "local" || route.query.mode === "local");

	function buildSyncPayload() {
		const { mirroredX: _mx, mirroredY: _my, ...settings } = store.exportSettings();
		return {
			...settings,
			textContent: store.textContent,
			playState: store.playState,
			previewState: store.previewState,
			scrollY: typeof window !== "undefined" ? window.scrollY : 0
		};
	}

	function applySyncPayload(payload: Record<string, unknown>) {
		store.importSettings(payload, { syncPlayback: true, applyMirror: false });
	}

	function buildClientStatePayload() {
		return {
			...store.exportSettings(),
			...(store.clientOverrides ?? {}),
			playState: store.playState,
			previewState: store.previewState
		};
	}

	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let broadcastTimer: ReturnType<typeof setTimeout> | null = null;

	function scheduleLiveSave() {
		if (isLocal.value || network.projectRole !== "host") return;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(async () => {
			try {
				const data = store.exportSettings();
				await saveProject(projectId.value, data);
			} catch (e) {
				console.error("Live save failed:", e);
			}
		}, 400);
	}

	function scheduleBroadcast() {
		if (isLocal.value || network.projectRole !== "host") return;
		if (broadcastTimer) clearTimeout(broadcastTimer);
		broadcastTimer = setTimeout(() => {
			broadcastState(projectId.value, buildSyncPayload());
		}, 100);
	}

	function pushFullStateToClients() {
		if (!isHost.value) return;
		broadcastState(projectId.value, buildSyncPayload());
	}

	onWsMessage("state:sync", (data) => {
		if (network.projectRole !== "client") return;
		if (data.projectId !== projectId.value) return;
		if (data.payload && typeof data.payload === "object") {
			applySyncPayload(data.payload as Record<string, unknown>);
		}
	});

	onWsMessage("host:resync", (data) => {
		if (network.projectRole !== "host") return;
		if (data.projectId !== projectId.value) return;
		pushFullStateToClients();
	});

	onWsMessage("control:command", (data) => {
		if (!store.isClientMode) return;
		if (data.projectId && data.projectId !== projectId.value) return;
		if (typeof data.command === "string") {
			handleControlCommand(data.command);
		}
	});

	onWsMessage("control:style", (data) => {
		if (!store.isClientMode) return;
		if (data.projectId && data.projectId !== projectId.value) return;
		if (data.payload && typeof data.payload === "object") {
			store.applyClientOverrides(data.payload as Record<string, unknown>);
		}
	});

	onWsMessage("control:switchProject", async (data) => {
		if (!store.isClientMode) return;
		const newProjectId = data.projectId as string;
		if (!newProjectId || newProjectId === projectId.value) return;
		try {
			await openProject(newProjectId, "client");
			const project = await getProject(newProjectId);
			store.importSettings(JSON.parse(project.data));
			store.previewState = true;
			applyThemeFromStore(store);
			await router.replace(`/project/${newProjectId}?role=client`);
		} catch (e) {
			console.error("Switch project failed:", e);
		}
	});

	onWsMessage("client:state:request", () => {
		if (!store.isClientMode) return;
		sendClientStateResponse({
			instanceId: network.instanceId,
			projectId: projectId.value,
			payload: buildClientStatePayload()
		});
	});

	onWsMessage("session:kicked", () => {
		goToDashboard();
	});

	onSessionJoined(() => {
		if (isHost.value) {
			pushFullStateToClients();
		}
	});

	async function initProject() {
		if (isLocal.value) {
			network.setConnectionMode("local");
			store.setClientMode(false);
			network.setProjectContext("local", "host");
			return;
		}

		network.setConnectionMode("remote");
		const rolePreference = route.query.role as "host" | "client" | undefined;

		try {
			const result = await openProject(projectId.value, rolePreference);
			const isClient = result.role === "client";
			store.setClientMode(isClient);

			const project = await getProject(projectId.value);
			const data = JSON.parse(project.data);
			store.importSettings(data);

			if (isClient) {
				store.previewState = true;
				const savedOverrides = loadPersistedClientOverrides(projectId.value, network.instanceId);
				if (savedOverrides) {
					store.applyClientOverrides(savedOverrides);
				}
			}

			applyThemeFromStore(store);

			if (!isClient) {
				pushFullStateToClients();
			}
		} catch (e) {
			const err = e as Error & { status?: number; canJoinAsClient?: boolean; existingHost?: string };
			if (err.status === 409 && err.canJoinAsClient) {
				console.warn("Host already active:", err.existingHost ?? err.message);
				await goToDashboard();
				return;
			}
			console.error("Failed to init project:", e);
		}
	}

	function preventSpaceScroll(event: KeyboardEvent) {
		if (event.key === " " && store.previewState) {
			event.preventDefault();
		}
	}

	onMounted(async () => {
		window.addEventListener("keydown", preventSpaceScroll);
		await initProject();
	});

	onUnmounted(() => {
		window.removeEventListener("keydown", preventSpaceScroll);
		if (saveTimer) clearTimeout(saveTimer);
		if (broadcastTimer) clearTimeout(broadcastTimer);
		if (!isLocal.value) {
			leaveSession();
		}
	});

	watch(
		() => store.textContent,
		() => {
			scheduleLiveSave();
			scheduleBroadcast();
		}
	);

	watch(
		() => [store.speed, store.settings, store.playState] as const,
		() => {
			scheduleLiveSave();
			scheduleBroadcast();
		},
		{ deep: true }
	);
</script>

<style scoped>
.client-mode-banner {
	position: fixed;
	top: calc(var(--navIconSize, 3rem) + 0.5rem);
	left: 50%;
	transform: translateX(-50%);
	padding: 0.4rem 1rem;
	border-radius: 999px;
	background: rgba(56, 200, 255, 0.15);
	color: #7dd3fc;
	font-size: 0.8rem;
	z-index: 50;
	pointer-events: none;
}
</style>
