<template>
	<div ref="root" class="file-menu">
		<button class="fileMenuButton" type="button" @click="toggleDropdown" @keydown.escape.prevent="closeDropdown">
			{{ t("nav.file") }}
		</button>
		<ul class="fileMenuDropdown" :class="{ open }" @click.stop>
			<li>
				<button type="button" @click="onNew">
					{{ t("fileMenu.new") }}
				</button>
			</li>
			<li>
				<button type="button" @click="onOpen">
					{{ t("fileMenu.open") }}
				</button>
			</li>
			<li>
				<button type="button" @click="onSaveAs">
					{{ t("fileMenu.saveAs") }}
				</button>
			</li>
			<li class="has-sub">
				<button type="button">
					{{ t("fileMenu.export") }}
				</button>
				<ul class="fileSubMenu">
					<li>
						<button type="button" @click="onExport('docx')">
							{{ t("fileMenu.word") }}
						</button>
					</li>
					<li>
						<button type="button" @click="onExport('pdf')">
							{{ t("fileMenu.pdf") }}
						</button>
					</li>
					<li>
						<button type="button" @click="onExport('odt')">
							{{ t("fileMenu.odt") }}
						</button>
					</li>
					<li>
						<button type="button" @click="onExport('md')">
							{{ t("fileMenu.markdown") }}
						</button>
					</li>
				</ul>
			</li>
		</ul>

		<ConfirmDialog
			:show="showNewConfirm"
			:title="t('fileMenu.newProjectTitle')"
			:message="t('fileMenu.newProjectMessage')"
			:confirm-text="t('fileMenu.remote')"
			:cancel-text="t('fileMenu.local')"
			@confirm="confirmNewRemote"
			@cancel="confirmNewLocal"
		/>

		<ConfirmDialog
			:show="showClearConfirm"
			:title="t('fileMenu.localProjectTitle')"
			:message="t('fileMenu.localProjectMessage')"
			:confirm-text="t('fileMenu.continue')"
			:cancel-text="t('fileMenu.cancel')"
			@confirm="startLocalProject"
			@cancel="showClearConfirm = false"
		/>
	</div>
</template>

<script lang="ts" setup>
	import ConfirmDialog from "~/components/Layout/ConfirmDialog.vue";
	import { useNetworkStore } from "@/stores/network";
	import { getDefaultProjectData, useStore } from "@/stores/store";
	import { emitAppEvent } from "~/composables/useAppEvents";
	import { useTelecatFileHandler } from "~/composables/useTelecatFileHandler";

	const { t } = useI18n();
	const { saveTelecatFile, openTelecatFile } = useTelecatFileHandler();
	const network = useNetworkStore();
	const router = useRouter();
	const { createProject, initServerUrl } = useTelecatServer();

	const open = ref(false);
	const root = ref<HTMLElement | null>(null);
	const showNewConfirm = ref(false);
	const showClearConfirm = ref(false);

	function toggleDropdown() {
		open.value = !open.value;
	}
	function closeDropdown() {
		open.value = false;
	}
	function onDocumentClick(e: MouseEvent) {
		const el = root.value;
		if (!el) return;
		const target = e.target as Node | null;
		if (target && !el.contains(target)) {
			open.value = false;
		}
	}

	onMounted(() => {
		document.addEventListener("click", onDocumentClick, { capture: true });
		initServerUrl();
	});
	onUnmounted(() => {
		document.removeEventListener("click", onDocumentClick, { capture: true } as any);
	});

	function onNew() {
		showNewConfirm.value = true;
		closeDropdown();
	}

	async function confirmNewRemote() {
		showNewConfirm.value = false;
		try {
			network.setConnectionMode("remote");
			const project = await createProject(undefined, getDefaultProjectData());
			await router.push(`/project/${project.id}?role=host`);
		} catch (e) {
			console.error("Remote project creation failed:", e);
		}
	}

	function confirmNewLocal() {
		showNewConfirm.value = false;
		showClearConfirm.value = true;
	}

	function startLocalProject() {
		showClearConfirm.value = false;
		const store = useStore();
		network.setConnectionMode("local");
		store.applyDefaultProjectData();
		store.setClientMode(false);
		emitAppEvent("file:new", undefined);
		router.push("/project/local?role=host&mode=local");
	}

	function onOpen() {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".telecat,.json,application/json";
		input.onchange = async (event) => {
			const file = (event.target as HTMLInputElement)?.files?.[0];
			if (file) {
				network.setConnectionMode("local");
				await openTelecatFile(file);
				const store = useStore();
				store.setClientMode(false);
				await router.push("/project/local?role=host&mode=local");
			}
		};
		input.click();
		closeDropdown();
	}

	function onSaveAs() {
		saveTelecatFile();
		closeDropdown();
	}

	function onExport(fmt: "docx" | "md" | "pdf" | "odt") {
		if (fmt === "docx") emitAppEvent("file:export:docx", undefined);
		else if (fmt === "pdf") emitAppEvent("file:export:pdf", undefined);
		else if (fmt === "odt") emitAppEvent("file:export:odt", undefined);
		else emitAppEvent("file:export:md", undefined);
		closeDropdown();
	}
</script>
