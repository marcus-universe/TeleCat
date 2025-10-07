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
			<li>
				<button type="button" @click="onImport">
					Import
				</button>
			</li>
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
			<li>
				<button type="button" @click="onExit">
					Exit
				</button>
			</li>
		</ul>
	</div>
</template>

<script lang="ts" setup>
	import { emitAppEvent } from "~/composables/useAppEvents";
	import { useTelecatFileHandler } from "~/composables/useTelecatFileHandler";
	import { useStore } from "~/stores/store";

	const { saveTelecatFile, openTelecatFile } = useTelecatFileHandler();
	const store = useStore();

	const open = ref(false);
	const root = ref<HTMLElement | null>(null);

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
		emitAppEvent("file:new", undefined);
		closeDropdown();
	}
	function onOpen() {
		// Open a .zip file and apply its settings
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".zip";
		input.onchange = async (event) => {
			const file = (event.target as HTMLInputElement)?.files?.[0];
			if (file) {
				await openTelecatFile(file);
			}
		};
		input.click();
		closeDropdown();
	}
	function onImport() {
		// Placeholder import event
		emitAppEvent("file:importContent", { content: "", extension: undefined });
		closeDropdown();
	}
	function onSave() {
		// Save the current state to a .telecat file
		saveTelecatFile();
		closeDropdown();
	}
	function onSaveAs() {
		// Use default filename "project.zip" for Save As (prompt/UI can be added later)
		(store as any)._lastSavedFilename = "project.zip";
		saveTelecatFile();
		closeDropdown();
	}
	function onExport(fmt: "docx" | "odt" | "md" | "pdf") {
		if (fmt === "docx") emitAppEvent("file:export:docx", undefined);
		else if (fmt === "pdf") emitAppEvent("file:export:pdf", undefined);
		else if (fmt === "odt") emitAppEvent("file:export:odt", undefined);
		else emitAppEvent("file:export:md", undefined);
		closeDropdown();
	}
	function onExit() {
		// Best-effort close; real app should wire OS integration
		try {
			window.close();
		} catch {}
		closeDropdown();
	}
</script>

<style scoped>
/* No component-scoped styles; styling lives in navbar.sass */
</style>
