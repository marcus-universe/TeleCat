<template>
	<div class="markdown-editor" :style="{ '--tc-highlight': store.settings.colorHighlight }">
		<EditBar :editor="editor" :show="!!editor && !previewState" />
		<div
			class="tiptap-wrapper"
			:style="previewTransform"
		>
			<EditorContent class="tiptap" :editor="editor" />
		</div>
	</div>
</template>

<script lang="ts" setup>
	import type { ExportFormat } from "~/composables/useFileConverter";
	// import Collaboration from "@tiptap/extension-collaboration";

	import { HocuspocusProvider } from "@hocuspocus/provider";
	import Highlight from "@tiptap/extension-highlight";
	import Image from "@tiptap/extension-image";
	import StarterKit from "@tiptap/starter-kit";
	import { EditorContent, useEditor } from "@tiptap/vue-3";
	import * as Y from "yjs";
	import EditBar from "~/components/Markdown/EditBar.vue";
	import { onAppEvent } from "~/composables/useAppEvents";
	import { useFileConverter } from "~/composables/useFileConverter";

	const store = useStore();
	// const websocketServer = computed(() => store.settings.websocketServer);

	const previewState = computed(() => store.previewState);
	const mirrorX = computed(() => store.settings.mirroredX);
	const mirrorY = computed(() => store.settings.mirroredY);

	const previewTransform = computed(() => {
		if (!previewState.value) return {};
		const sx = mirrorX.value ? -1 : 1;
		const sy = mirrorY.value ? -1 : 1;
		return { transform: `scale(${sx}, ${sy})`, transformOrigin: "center" };
	});

	// --- WebSocket Provider handling (conditionally enabled) ---
	// Keep a mutable reference to the provider so we can connect/disconnect based on settings
	let provider: HocuspocusProvider | null = null;
	const ydoc = new Y.Doc();
	const wsUrl = computed(() => {
		const host = store.settings.websocketServer.host?.trim() || "";
		if (host.startsWith("ws://") || host.startsWith("wss://")) return host;
		return `ws://${host}`;
	});

	function createProvider() {
		// Safety: destroy an existing provider before creating a new one
		if (provider) {
			try {
				provider.destroy();
			} catch {}
			provider = null;
		}
		provider = new HocuspocusProvider({
			url: wsUrl.value,
			name: "telecat",
			document: ydoc
			// Do not auto-connect when the toggle is off
			// connect: true
		});
		// Optional: log connection state (useful during development)
		provider.on("connect", () => {
			store.setWebsocketConnected(true);
		});
		provider.on("disconnect", () => {
			store.setWebsocketConnected(false);
		});
		provider.on("close", () => {
			store.setWebsocketConnected(false);
		});
	}

	// React to changes in websocket active state and host
	watch(
		() => [store.settings.websocketServer.active, store.settings.websocketServer.host] as const,
		([active]) => {
			if (active) {
				createProvider();
			} else {
				// When deactivated: cleanly destroy and prevent any reconnection attempts
				if (provider) {
					try {
						provider.destroy();
					} catch {}
					provider = null;
				}
				store.setWebsocketConnected(false);
			}
		},
		{ immediate: true }
	);

	// Create the editor with the Y.js document
	function dedupeExtensions(list: any[]) {
		const seen = new Set<string>();
		const out: any[] = [];
		for (const ext of list) {
			const name = (ext && (ext.name || (ext.config && ext.config.name))) as string | undefined;
			if (!name || !seen.has(name)) {
				out.push(ext);
				if (name) seen.add(name);
			}
		}
		return out;
	}

	const baseExtensions: any[] = [
		StarterKit.configure({
			link: {
				openOnClick: true,
				defaultProtocol: "https",
				autolink: true,
				linkOnPaste: true,
				HTMLAttributes: {
					rel: "noopener noreferrer nofollow",
					target: "_blank"
				}
			}
		}),
		Highlight.configure({ multicolor: true }),
		Image.configure({
			allowBase64: true,
			HTMLAttributes: {
				style: "max-width:100%;height:auto;display:block;margin:1.5rem 0;"
			}
		})
	];

	const editor = useEditor({
		extensions: dedupeExtensions(baseExtensions),
		content: store.textContent,
		editable: !previewState.value,
		autofocus: !previewState.value,
		onUpdate: ({ editor }) => {
			// Persist the editor content as HTML so it matches the format in the store
			store.textContent = editor.getHTML();
		}
	});

	// Watch for changes in previewState to toggle editability
	watch(previewState, (value) => {
		if (editor.value) {
			editor.value.setEditable(!value);
		}
	});

	// BubbleMenu removed in favor of resize handle on the node itself

	// Handle export events
	const { convert } = useFileConverter();

	async function saveBlobWithDialog(blob: Blob, suggestedName: string, mime: string) {
		// Try File System Access API
		const anyWin = window as any;
		if (anyWin.showSaveFilePicker) {
			try {
				const handle = await anyWin.showSaveFilePicker({
					suggestedName,
					types: [{ description: mime, accept: { [mime]: [`.${suggestedName.split(".").pop()}`] } }]
				});
				const writable = await handle.createWritable();
				await writable.write(blob);
				await writable.close();
				return;
			} catch {}
		}
		// Fallback: trigger download
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = suggestedName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	async function handleExport(format: ExportFormat) {
		if (!editor.value) return;
		const html = editor.value.getHTML();
		try {
			const result = await convert(html, format);
			await saveBlobWithDialog(result.blob, result.defaultFileName, result.mime);
		} catch (e) {
			console.warn("Export failed:", e);
		}
	}

	const disposeExportMd = onAppEvent("file:export:md", () => {
		handleExport("md");
	});

	const disposeExportDocx = onAppEvent("file:export:docx", () => {
		handleExport("docx");
	});
	const disposeExportOdt = onAppEvent("file:export:odt", () => {
		handleExport("odt");
	});

	const disposeExportPdf = onAppEvent("file:export:pdf", () => {
		handleExport("pdf" as any);
	});

	// Clean up on unmount
	onUnmounted(() => {
		if (provider) {
			try {
				provider.destroy();
			} catch {}
			provider = null;
		}
		try {
			disposeExportMd();
		} catch {}
		try {
			disposeExportDocx();
		} catch {}
		try {
			disposeExportOdt();
		} catch {}
		try {
			disposeExportPdf();
		} catch {}
	});
</script>

<style>
.tiptap-wrapper {
	display: block;
	width: 100%;
}

.markdown-editor {
	display: flex;
	flex-direction: column;
}

/* Basic editor styles similar to the Tiptap example */
.tiptap :first-child {
	margin-top: 0;
}

.tiptap img {
	display: block;
	height: auto;
	margin: 1.5rem 0;
	max-width: 100%;
}

.tiptap img.ProseMirror-selectednode {
	outline: 3px solid var(--tc-highlight);
}

/* Prevent dev/debug overlays (e.g., vue-tracer) from blocking mouse/drag events */
.vue-tracer-overlay,
.vue-tracer-overlay * {
	pointer-events: none !important;
}
</style>
