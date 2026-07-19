<template>
	<div class="control-page">
		<header class="control-header">
			<h1>{{ t("control.title") }}</h1>
			<p>{{ t("control.subtitle") }}</p>
		</header>

		<section class="control-section client-tabs-section">
			<div class="client-tabs-row">
				<div class="client-tabs-scroll">
					<button
						v-for="client in displayClients"
						:key="client.instanceId"
						type="button"
						class="client-tab"
						:class="{ active: selectedClientId === client.instanceId, offline: !client.online }"
						@click="selectClient(client.instanceId)"
					>
						<span class="client-tab-name">{{ client.instanceName }}</span>
						<span class="client-tab-project">{{ client.projectName }}</span>
						<span class="client-tab-status">{{ client.online ? t("control.online") : t("control.offline") }}</span>
					</button>
				</div>
				<button type="button" class="client-refresh option button flex_c_h" :title="t('control.refresh')" @click="refreshClients">
					<DesignIcons icon="refresh-rounded" customclass="refresh-rounded" />
				</button>
			</div>
		</section>

		<section v-if="selectedClient" class="control-section">
			<label for="switch-project">{{ t("control.switchProject") }}</label>
			<select id="switch-project" v-model="switchProjectId" @change="onSwitchProject">
				<option value="" disabled>
					{{ t("control.selectProject") }}
				</option>
				<option v-for="project in network.projects" :key="project.id" :value="project.id">
					{{ project.name }}
				</option>
			</select>
		</section>

		<section v-if="selectedClient" class="control-buttons">
			<div class="control-row">
				<button type="button" class="control-btn" :title="t('control.scrollUp')" @click="send('scrollUp')">
					<DesignIcons icon="direction" customclass="direction" />
					<span>{{ t("control.scrollUp") }}</span>
				</button>
				<button type="button" class="control-btn" :title="t('control.scrollDown')" @click="send('scrollDown')">
					<DesignIcons icon="direction" customclass="direction" />
					<span>{{ t("control.scrollDown") }}</span>
				</button>
			</div>

			<div class="control-row">
				<button type="button" class="control-btn play" @click="send('play')">
					<DesignIcons icon="play" customclass="play" />
					<span>{{ t("control.play") }}</span>
				</button>
				<button type="button" class="control-btn stop" @click="send('stop')">
					<DesignIcons icon="stop" customclass="stop" />
					<span>{{ t("control.stop") }}</span>
				</button>
			</div>

			<div class="control-row">
				<button type="button" class="control-btn" @click="send('jumpStart')">
					{{ t("control.jumpStart") }}
				</button>
				<button type="button" class="control-btn" @click="send('jumpEnd')">
					{{ t("control.jumpEnd") }}
				</button>
			</div>

			<div class="control-row">
				<button type="button" class="control-btn direction-btn" @click="send('toggleDirection')">
					{{ t("control.toggleDirection") }}
				</button>
			</div>
		</section>

		<section v-if="selectedClient" class="control-section control-settings-section">
			<ControlClientStyling v-model="clientStyle" />
		</section>

		<section v-if="displayClients.length === 0" class="control-empty">
			{{ t("control.noClients") }}
		</section>
		<section v-else-if="!selectedClient" class="control-empty">
			{{ t("control.selectClientHint") }}
		</section>
	</div>
</template>

<script lang="ts" setup>
	import type { ClientStyleModel } from "~/components/Layout/ControlClientStyling.vue";
	import type { ControlCommand } from "~/composables/useTelecatServer";
	import ControlClientStyling from "~/components/Layout/ControlClientStyling.vue";
	import {
		loadControlClientStyle,
		persistControlClientStyle
	} from "~/composables/useClientStylePersistence";
	import { useNetworkStore } from "@/stores/network";

	definePageMeta({ layout: "home" });

	const { t } = useI18n();
	const network = useNetworkStore();
	const {
		initServerUrl,
		connectWebSocket,
		requestClientsList,
		sendControlCommand,
		sendControlStyle,
		sendSwitchProject,
		requestClientState,
		onWsMessage,
		fetchNetworkSessions,
		fetchProjects
	} = useTelecatServer();

	const selectedClientId = ref("");
	const switchProjectId = ref("");
	const isHydrating = ref(false);
	let pollTimer: ReturnType<typeof setInterval> | null = null;
	let styleDebounce: ReturnType<typeof setTimeout> | null = null;

	function defaultClientStyle(): ClientStyleModel {
		return {
			speed: 80,
			fontScale: 3,
			sidePadding: 6.4,
			mirroredX: false,
			mirroredY: false,
			colorText: "#eeeeee",
			colorBackground: "0, 0, 0",
			colorTheme: "#eeeeee",
			colorHighlight: "#6038FF",
			h1Scale: 4.5,
			h2Scale: 3.5,
			h3Scale: 2.5,
			pSize: 1.5,
			pSpacing: 1,
			pLineHeight: 1.5
		};
	}

	const clientStyle = ref<ClientStyleModel>(defaultClientStyle());

	const displayClients = computed(() =>
		network.connectedClients.filter(c => c.online !== false)
	);

	const selectedClient = computed(() =>
		displayClients.value.find(c => c.instanceId === selectedClientId.value) ?? null
	);

	function applyPayloadToStyle(payload: Record<string, unknown>) {
		isHydrating.value = true;
		const current = defaultClientStyle();
		clientStyle.value = {
			speed: (payload.speed as number) ?? current.speed,
			fontScale: (payload.fontScale as number) ?? current.fontScale,
			sidePadding: (payload.sidePadding as number) ?? current.sidePadding,
			mirroredX: (payload.mirroredX as boolean) ?? current.mirroredX,
			mirroredY: (payload.mirroredY as boolean) ?? current.mirroredY,
			colorText: (payload.colorText as string) ?? current.colorText,
			colorBackground: (payload.colorBackground as string) ?? current.colorBackground,
			colorTheme: (payload.colorTheme as string) ?? current.colorTheme,
			colorHighlight: (payload.colorHighlight as string) ?? current.colorHighlight,
			h1Scale: (payload.h1Scale as number) ?? current.h1Scale,
			h2Scale: (payload.h2Scale as number) ?? current.h2Scale,
			h3Scale: (payload.h3Scale as number) ?? current.h3Scale,
			pSize: (payload.pSize as number) ?? current.pSize,
			pSpacing: (payload.pSpacing as number) ?? current.pSpacing,
			pLineHeight: (payload.pLineHeight as number) ?? current.pLineHeight
		};
		switchProjectId.value = (payload.projectId as string) ?? selectedClient.value?.projectId ?? "";
		nextTick(() => {
			isHydrating.value = false;
		});
	}

	function selectClient(instanceId: string) {
		selectedClientId.value = instanceId;
		const client = displayClients.value.find(c => c.instanceId === instanceId);
		switchProjectId.value = client?.projectId ?? "";

		const savedStyle = loadControlClientStyle(instanceId);
		if (savedStyle) {
			isHydrating.value = true;
			clientStyle.value = { ...defaultClientStyle(), ...savedStyle };
			nextTick(() => {
				isHydrating.value = false;
			});
		}

		requestClientState(instanceId);
	}

	function buildStylePayload(): Record<string, unknown> {
		const s = clientStyle.value;
		return {
			speed: s.speed,
			fontScale: s.fontScale,
			sidePadding: s.sidePadding,
			mirroredX: s.mirroredX,
			mirroredY: s.mirroredY,
			colorText: s.colorText,
			colorBackground: s.colorBackground,
			colorTheme: s.colorTheme,
			colorHighlight: s.colorHighlight,
			h1Scale: s.h1Scale,
			h2Scale: s.h2Scale,
			h3Scale: s.h3Scale,
			pSize: s.pSize,
			pSpacing: s.pSpacing,
			pLineHeight: s.pLineHeight
		};
	}

	function liveSendStyle() {
		if (isHydrating.value || !selectedClient.value) return;
		persistControlClientStyle(selectedClient.value.instanceId, clientStyle.value);
		sendControlStyle(buildStylePayload(), {
			projectId: selectedClient.value.projectId,
			targetInstanceId: selectedClient.value.instanceId
		});
	}

	function send(command: ControlCommand) {
		if (!selectedClient.value) return;
		sendControlCommand(command, {
			projectId: selectedClient.value.projectId,
			targetInstanceId: selectedClient.value.instanceId
		});
	}

	function onSwitchProject() {
		if (!selectedClient.value || !switchProjectId.value) return;
		sendSwitchProject(selectedClient.value.instanceId, switchProjectId.value);
	}

	function refreshClients() {
		requestClientsList();
		fetchNetworkSessions();
		fetchProjects();
	}

	onWsMessage("client:state:response", (data) => {
		if (data.instanceId !== selectedClientId.value) return;
		if (data.payload && typeof data.payload === "object") {
			applyPayloadToStyle({
				...(data.payload as Record<string, unknown>),
				projectId: data.projectId
			});
		}
	});

	onMounted(() => {
		initServerUrl();
		network.setConnectionMode("remote");
		connectWebSocket("control");
		onWsMessage("clients:list", () => {});
		onWsMessage("network:update", () => {
			requestClientsList();
		});
		refreshClients();
		pollTimer = setInterval(() => requestClientsList(), 3000);
	});

	onUnmounted(() => {
		if (pollTimer) clearInterval(pollTimer);
		if (styleDebounce) clearTimeout(styleDebounce);
	});

	watch(displayClients, (clients) => {
		if (clients.length === 0) {
			selectedClientId.value = "";
			return;
		}
		if (!clients.some(c => c.instanceId === selectedClientId.value)) {
			selectClient(clients[0].instanceId);
		}
	}, { immediate: true });

	watch(clientStyle, () => {
		if (styleDebounce) clearTimeout(styleDebounce);
		styleDebounce = setTimeout(liveSendStyle, 150);
	}, { deep: true });
</script>
