<template>
	<div ref="root" class="file-menu">
		<button class="fileMenuButton" type="button" @click="toggleDropdown" @keydown.escape.prevent="closeDropdown">
			File
		</button>
		<ul class="fileMenuDropdown" :class="{ open }" @click.stop>
			<li>
				<button type="button" @click="onNew">
					New
				</button>
			</li>
			<li>
				<button type="button" @click="onOpen">
					Open
				</button>
			</li>
			<!-- <li>
				<button type="button" @click="onImport">
					Import
				</button>
			</li> -->
			<li>
				<button type="button" @click="onSave">
					Save
				</button>
			</li>
			<li>
				<button type="button" @click="onSaveAs">
					Save as
				</button>
			</li>
			<li class="has-sub">
				<button type="button">
					Export
				</button>
				<ul class="fileSubMenu">
					<li>
						<button type="button" @click="onExport('docx')">
							Word
						</button>
					</li>
					<li>
						<button type="button" @click="onExport('pdf')">
							PDF
						</button>
					</li>
					<li>
						<button type="button" @click="onExport('odt')">
							ODT
						</button>
					</li>
					<li>
						<button type="button" @click="onExport('md')">
							Markdown
						</button>
					</li>
				</ul>
			</li>
			<!-- <li>
				<button type="button" @click="onExit">
					Exit
				</button>
			</li> -->
		</ul>

		<ConfirmDialog
			:show="showNewConfirm"
			title="New File"
			message="Are you sure you want to create a new file? All unsaved changes will be lost."
			confirm-text="Create New"
			cancel-text="Cancel"
			@confirm="confirmNew"
			@cancel="cancelNew"
		/>
	</div>
</template>

<script lang="ts" setup>
	import ConfirmDialog from "~/components/Layout/ConfirmDialog.vue";
	import { emitAppEvent } from "~/composables/useAppEvents";
	import { useTelecatFileHandler } from "~/composables/useTelecatFileHandler";

	const { saveTelecatFile, openTelecatFile } = useTelecatFileHandler();

	const open = ref(false);
	const root = ref<HTMLElement | null>(null);
	const showNewConfirm = ref(false);

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
	});
	onUnmounted(() => {
		document.removeEventListener("click", onDocumentClick, { capture: true } as any);
	});

	function onNew() {
		showNewConfirm.value = true;
		closeDropdown();
	}

	function confirmNew() {
		// Clear editor content
		const store = useStore();
		store.textContent = "";
		showNewConfirm.value = false;
		emitAppEvent("file:new", undefined);
	}

	function cancelNew() {
		showNewConfirm.value = false;
	}
	function onOpen() {
		// Open a config.json file and apply it to the store
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json";
		input.onchange = async (event) => {
			const file = (event.target as HTMLInputElement)?.files?.[0];
			if (file) {
				await openTelecatFile(file);
			}
		};
		input.click();
		closeDropdown();
	}
	function _onImport() {
		// Placeholder import event
		emitAppEvent("file:importContent", { content: "", extension: undefined });
		closeDropdown();
	}
	function onSave() {
		// Save config.json only
		saveTelecatFile();
		closeDropdown();
	}
	function onSaveAs() {
		// Save As will show a file picker; we always save config.json
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
	function _onExit() {
		// Best-effort close; real app should wire OS integration
		try {
			window.close();
		} catch {}
		closeDropdown();
	}
</script>

<style scoped>
/* No component-scoped styles; styling lives in navbar.sass */

/* Confirm Dialog Styles */
.confirm-dialog-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	backdrop-filter: blur(2px);
}

.confirm-dialog {
	background: var(--color_bg, #fff);
	border-radius: 8px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
	max-width: 400px;
	width: 90%;
	max-height: 80vh;
	overflow: hidden;
	animation: dialogSlideIn 0.2s ease-out;
}

@keyframes dialogSlideIn {
	from {
		transform: translateY(-20px);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}

.confirm-dialog-header {
	padding: 1.5rem 1.5rem 0;
	border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.confirm-dialog-header h3 {
	margin: 0 0 1rem 0;
	color: var(--text_color, #333);
	font-size: 1.25rem;
	font-weight: 600;
}

.confirm-dialog-body {
	padding: 1.5rem;
}

.confirm-dialog-body p {
	margin: 0;
	color: var(--text_color, #666);
	line-height: 1.5;
}

.confirm-dialog-actions {
	padding: 0 1.5rem 1.5rem;
	display: flex;
	gap: 1rem;
	justify-content: flex-end;
}

.btn {
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.875rem;
	font-weight: 500;
	transition: all 0.2s ease;
	outline: none;
}

.btn:focus {
	box-shadow: 0 0 0 3px rgba(64, 120, 255, 0.3);
}

.btn-secondary {
	background: #e5e5e5;
	color: #666;
}

.btn-secondary:hover {
	background: #d4d4d4;
}

.btn-primary {
	background: var(--color_p, #4078ff);
	color: white;
}

.btn-primary:hover {
	background: var(--color_p, #326ce5);
	transform: translateY(-1px);
}
</style>
