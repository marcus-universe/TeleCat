<template>
	<div class="dashboard">
		<header class="dashboard-header">
			<h1>{{ t("dashboard.title") }}</h1>
			<p class="dashboard-subtitle">
				{{ t("dashboard.subtitle") }}
			</p>
		</header>

		<section class="dashboard-section">
			<div class="dashboard-toolbar">
				<div class="server-config">
					<label for="server-select">{{ t("dashboard.serverUrl") }}</label>
					<select
						id="server-select"
						v-model="selectedServerUrl"
						class="server-select"
						@change="onServerSelectionChange"
					>
						<option value="">
							{{ t("dashboard.serverUrlPlaceholder") }}
						</option>
						<option v-for="server in discoveredServers" :key="server.url" :value="server.url">
							{{ server.label }}
						</option>
						<option :value="CUSTOM_SERVER_OPTION">
							{{ t("dashboard.customServerUrl") }}
						</option>
					</select>
					<input
						v-if="selectedServerUrl === CUSTOM_SERVER_OPTION"
						id="server-custom-url"
						v-model="customServerUrl"
						type="url"
						class="server-custom-url"
						:placeholder="customServerUrlPlaceholder"
						@keydown.enter.prevent="applyCustomServerUrl"
					>
					<button
						v-if="selectedServerUrl === CUSTOM_SERVER_OPTION"
						type="button"
						class="btn-secondary btn-compact"
						:disabled="validatingCustomUrl"
						@click="applyCustomServerUrl"
					>
						{{ validatingCustomUrl ? t("dashboard.customServerUrlChecking") : t("dashboard.customServerUrlApply") }}
					</button>
					<label for="server-scan-port">{{ t("dashboard.scanPort") }}</label>
					<input
						id="server-scan-port"
						v-model.number="scanPort"
						type="number"
						class="server-scan-port"
						min="1"
						max="65535"
						@change="onScanPortChange"
					>
					<button
						type="button"
						class="btn-icon"
						:class="{ spinning: scanning }"
						:title="t('dashboard.scanServers')"
						:disabled="scanning"
						@click="onScanServers"
					>
						<DesignIcons icon="refresh" customclass="refresh" />
					</button>
					<span class="connection-badge" :class="{ online: network.connected }">
						{{ network.connected ? t("dashboard.connected") : t("dashboard.disconnected") }}
					</span>
				</div>
				<div class="dashboard-actions">
					<button type="button" class="btn-primary" @click="onNewProject">
						{{ t("dashboard.newProject") }}
					</button>
					<button type="button" class="btn-secondary" @click="refreshAll">
						{{ t("dashboard.refresh") }}
					</button>
				</div>
			</div>
		</section>

		<section class="dashboard-section">
			<h2>{{ t("dashboard.recentProjects") }}</h2>
			<div v-if="loading" class="dashboard-empty">
				{{ t("dashboard.loading") }}
			</div>
			<div v-else-if="network.projects.length === 0" class="dashboard-empty">
				{{ t("dashboard.noProjects") }}
			</div>
			<div v-else class="project-grid">
				<article
					v-for="project in network.projects"
					:key="project.id"
					class="project-card"
					@click="onOpenProject(project.id)"
				>
					<div class="project-card-actions">
						<button
							type="button"
							class="project-rename"
							:title="t('dashboard.renameProject')"
							@click.stop="onRenameProject(project.id, project.name)"
						>
							<DesignIcons icon="rename" customclass="rename" />
						</button>
						<button
							type="button"
							class="project-delete"
							:title="t('dashboard.deleteProject')"
							@click.stop="onDeleteProject(project.id, project.name)"
						>
							<DesignIcons icon="trash" customclass="trash" />
						</button>
					</div>
					<h3>{{ project.name }}</h3>
					<p class="project-meta">
						{{ t("dashboard.updated") }}: {{ formatDate(project.updated_at) }}
					</p>
					<div class="project-badges">
						<span v-if="project.session_count > 0" class="badge badge-active">
							{{ project.session_count }} {{ t("dashboard.sessions") }}
						</span>
						<span v-if="hasHost(project.id)" class="badge badge-host">
							{{ t("dashboard.hostActive") }}
						</span>
					</div>
				</article>
			</div>
		</section>

		<section class="dashboard-section">
			<h2>{{ t("dashboard.activeSessions") }}</h2>
			<div v-if="network.networkSessions.length === 0" class="dashboard-empty">
				{{ t("dashboard.noSessions") }}
			</div>
			<table v-else class="sessions-table">
				<thead>
					<tr>
						<th>{{ t("dashboard.project") }}</th>
						<th>{{ t("dashboard.instance") }}</th>
						<th>{{ t("dashboard.ipAddress") }}</th>
						<th>{{ t("dashboard.role") }}</th>
						<th>{{ t("dashboard.opened") }}</th>
						<th>{{ t("dashboard.actions") }}</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="session in network.networkSessions" :key="session.id">
						<td>{{ session.project_name }}</td>
						<td>{{ session.instance_name }}</td>
						<td>{{ session.ip_address || "—" }}</td>
						<td>
							<span class="badge" :class="session.role === 'host' ? 'badge-host' : 'badge-client'">
								{{ session.role === "host" ? t("dashboard.host") : t("dashboard.client") }}
							</span>
						</td>
						<td>{{ formatDate(session.opened_at) }}</td>
						<td>
							<button
								type="button"
								class="session-kick"
								:title="t('dashboard.kickSession')"
								@click="onKickSession(session.id, session.instance_name)"
							>
								<DesignIcons icon="kick" customclass="kick" />
							</button>
						</td>
					</tr>
				</tbody>
			</table>
		</section>

		<ConfirmDialog
			:show="showNewDialog"
			:title="t('dashboard.newProjectTitle')"
			:message="t('dashboard.newProjectMessage')"
			:confirm-text="t('dashboard.remote')"
			:cancel-text="t('dashboard.local')"
			@confirm="createRemoteProject"
			@cancel="createLocalProject"
		/>

		<ProjectRoleDialog
			:show="showRoleDialog"
			:title="t('roleDialog.title')"
			:message="t('roleDialog.message')"
			:host-taken="roleDialogHostTaken"
			@select="onRoleSelected"
			@cancel="showRoleDialog = false"
		/>

		<ConfirmDialog
			:show="showDeleteDialog"
			:title="t('dashboard.deleteProjectTitle')"
			:message="deleteMessage"
			:confirm-text="t('dashboard.deleteConfirm')"
			:cancel-text="t('fileMenu.cancel')"
			@confirm="confirmDelete"
			@cancel="showDeleteDialog = false"
		/>

		<NamePromptDialog
			:show="showNameDialog"
			:title="nameDialogTitle"
			:message="nameDialogMessage"
			:placeholder="t('dashboard.enterProjectName')"
			:initial-value="nameDialogInitial"
			:confirm-text="t('dashboard.confirm')"
			:cancel-text="t('fileMenu.cancel')"
			@confirm="onNameConfirmed"
			@cancel="showNameDialog = false"
		/>
	</div>
</template>

<script lang="ts" setup>
	import ConfirmDialog from "~/components/Layout/ConfirmDialog.vue";
	import NamePromptDialog from "~/components/Layout/NamePromptDialog.vue";
	import ProjectRoleDialog from "~/components/Layout/ProjectRoleDialog.vue";
	import { useNetworkStore } from "@/stores/network";
	import { getDefaultProjectData, useStore } from "@/stores/store";
	import { CUSTOM_SERVER_OPTION } from "~/composables/useServerDiscovery";

	definePageMeta({ layout: "home" });

	const { t, locale } = useI18n();
	const network = useNetworkStore();
	const store = useStore();
	const router = useRouter();
	const {
		initServerUrl,
		fetchProjects,
		fetchNetworkSessions,
		createProject,
		renameProject,
		deleteProject,
		kickSession,
		joinSession,
		onWsMessage
	} = useTelecatServer();
	const {
		servers: discoveredServers,
		scanning,
		scanPort,
		setScanPort,
		scanServers,
		validateServerUrl,
		selectServer
	} = useServerDiscovery();

	const customServerUrlPlaceholder = computed(() =>
		t("dashboard.customServerUrlPlaceholder", { port: scanPort.value })
	);

	const loading = ref(true);
	const showNewDialog = ref(false);
	const showRoleDialog = ref(false);
	const showDeleteDialog = ref(false);
	const showNameDialog = ref(false);
	const nameDialogTitle = ref("");
	const nameDialogMessage = ref("");
	const nameDialogInitial = ref("");
	const nameDialogMode = ref<"create" | "rename">("create");
	const roleDialogHostTaken = ref(false);
	const pendingProjectId = ref<string | null>(null);
	const pendingDeleteId = ref<string | null>(null);
	const pendingRenameId = ref<string | null>(null);
	const deleteMessage = ref("");
	const selectedServerUrl = ref("");
	const customServerUrl = ref("");
	const validatingCustomUrl = ref(false);
	let pollTimer: ReturnType<typeof setInterval> | null = null;

	function syncServerSelectionFromStore() {
		const current = network.serverUrl;
		if (!current) {
			selectedServerUrl.value = "";
			return;
		}

		if (discoveredServers.value.some(server => server.url === current)) {
			selectedServerUrl.value = current;
			return;
		}

		selectedServerUrl.value = CUSTOM_SERVER_OPTION;
		customServerUrl.value = current;
	}

	function applyServerUrl(url = selectedServerUrl.value) {
		network.setServerUrl(url);
		if (url) selectServer(url);
		network.setConnectionMode("remote");
		joinSession("control");
		refreshAll();
	}

	function onServerSelectionChange() {
		if (selectedServerUrl.value === CUSTOM_SERVER_OPTION) return;
		applyServerUrl();
	}

	async function applyCustomServerUrl() {
		const candidate = customServerUrl.value.trim();
		if (!candidate) return;

		validatingCustomUrl.value = true;
		try {
			const server = await validateServerUrl(candidate);
			if (!server) {
				alert(t("dashboard.customServerUrlInvalid"));
				return;
			}

			if (!discoveredServers.value.some(entry => entry.url === server.url)) {
				discoveredServers.value = [...discoveredServers.value, server].sort((a, b) => a.label.localeCompare(b.label));
			}

			customServerUrl.value = server.url;
			selectedServerUrl.value = server.url;
			applyServerUrl(server.url);
		} finally {
			validatingCustomUrl.value = false;
		}
	}

	function onScanPortChange() {
		setScanPort(scanPort.value);
	}

	function formatDate(value: string) {
		const localeCode = locale.value === "de" ? "de-DE" : "en-US";
		return new Date(value).toLocaleString(localeCode);
	}

	function hasHost(projectId: string) {
		return network.networkSessions.some(s => s.project_id === projectId && s.role === "host");
	}

	async function onKickSession(sessionId: string, instanceName: string) {
		if (!confirm(t("dashboard.kickSessionMessage", { name: instanceName }))) return;
		try {
			await kickSession(sessionId);
		} catch (e) {
			console.error("Kick session failed:", e);
		}
	}

	async function onScanServers() {
		setScanPort(scanPort.value);
		await scanServers();
		syncServerSelectionFromStore();
		if (!network.serverUrl && discoveredServers.value.length > 0) {
			selectedServerUrl.value = discoveredServers.value[0].url;
			applyServerUrl(discoveredServers.value[0].url);
		}
	}

	async function refreshAll() {
		loading.value = true;
		try {
			network.setConnectionMode("remote");
			await Promise.all([fetchProjects(), fetchNetworkSessions()]);
		} catch (e) {
			console.error("Dashboard refresh failed:", e);
		} finally {
			loading.value = false;
		}
	}

	function onNewProject() {
		showNewDialog.value = true;
	}

	function createRemoteProject() {
		showNewDialog.value = false;
		nameDialogMode.value = "create";
		nameDialogTitle.value = t("dashboard.newProjectTitle");
		nameDialogMessage.value = t("dashboard.enterProjectNameHint");
		nameDialogInitial.value = "";
		showNameDialog.value = true;
	}

	async function createLocalProject() {
		showNewDialog.value = false;
		network.setConnectionMode("local");
		store.applyDefaultProjectData();
		store.setClientMode(false);
		await router.push("/project/local?role=host&mode=local");
	}

	function onOpenProject(id: string) {
		pendingProjectId.value = id;
		roleDialogHostTaken.value = hasHost(id);
		showRoleDialog.value = true;
	}

	async function onRoleSelected(role: "host" | "client") {
		showRoleDialog.value = false;
		const id = pendingProjectId.value;
		if (!id) return;
		pendingProjectId.value = null;

		try {
			network.setConnectionMode("remote");
			await router.push(`/project/${id}?role=${role}`);
		} catch (e) {
			console.error("Open project failed:", e);
		}
	}

	function onRenameProject(id: string, name: string) {
		pendingRenameId.value = id;
		nameDialogMode.value = "rename";
		nameDialogTitle.value = t("dashboard.renameProjectTitle");
		nameDialogMessage.value = t("dashboard.renameProjectMessage");
		nameDialogInitial.value = name;
		showNameDialog.value = true;
	}

	async function onNameConfirmed(name: string) {
		showNameDialog.value = false;
		if (nameDialogMode.value === "create") {
			try {
				const project = await createProject(name, getDefaultProjectData());
				await fetchProjects();
				pendingProjectId.value = project.id;
				roleDialogHostTaken.value = false;
				showRoleDialog.value = true;
			} catch (e) {
				console.error("Create project failed:", e);
			}
			return;
		}
		const id = pendingRenameId.value;
		pendingRenameId.value = null;
		if (!id) return;
		try {
			await renameProject(id, name);
		} catch (e) {
			console.error("Rename project failed:", e);
		}
	}

	function onDeleteProject(id: string, name: string) {
		pendingDeleteId.value = id;
		deleteMessage.value = t("dashboard.deleteProjectMessage", { name });
		showDeleteDialog.value = true;
	}

	async function confirmDelete() {
		showDeleteDialog.value = false;
		const id = pendingDeleteId.value;
		pendingDeleteId.value = null;
		if (!id) return;
		try {
			await deleteProject(id);
			await fetchNetworkSessions();
		} catch (e) {
			console.error("Delete project failed:", e);
		}
	}

	onMounted(async () => {
		initServerUrl();
		syncServerSelectionFromStore();
		network.setConnectionMode("remote");
		onWsMessage("network:update", () => {
			fetchNetworkSessions();
			fetchProjects();
		});
		await onScanServers();
		await refreshAll();
		joinSession("control");
		pollTimer = setInterval(() => {
			fetchNetworkSessions().catch(() => {});
			fetchProjects().catch(() => {});
		}, 5000);
	});

	onUnmounted(() => {
		if (pollTimer) clearInterval(pollTimer);
	});
</script>
