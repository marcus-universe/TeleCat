<template>
	<div class="markdown-editor" :style="{ '--tc-highlight': store.settings.colorHighlight }">
		<EditBar :editor="editor" :show="!previewState && !isClientMode" />
		<EditorContent :class="tiptapClasses" :editor="editor" />
		<ImageResizer />
	</div>
</template>

<script lang="ts" setup>
	import type { ExportFormat } from "~/composables/useFileConverter";
	// import Collaboration from "@tiptap/extension-collaboration";

	// import { HocuspocusProvider } from "@hocuspocus/provider";
	import Highlight from "@tiptap/extension-highlight";
	import Image from "@tiptap/extension-image";
	import StarterKit from "@tiptap/starter-kit";
	import { EditorContent, useEditor } from "@tiptap/vue-3";
	// import * as Y from "yjs";
	import EditBar from "~/components/Markdown/EditBar.vue";
	import ImageResizer from "~/components/Markdown/ImageResizer.vue";
	import { tiptapEditorKey } from "~/composables/useTiptapEditor";
	import { onAppEvent } from "~/composables/useAppEvents";
	import { useFileConverter } from "~/composables/useFileConverter";

	const store = useStore();
	// const websocketServer = computed(() => store.settings.websocketServer);

	const previewState = computed(() => store.previewState);
	const isClientMode = computed(() => store.isClientMode);
	const mirrorX = computed(() => store.settings.mirroredX);
	const mirrorY = computed(() => store.settings.mirroredY);

	// Compute classes for the EditorContent so CSS can handle mirroring in SASS
	const tiptapClasses = computed(() => {
		const classes: Record<string, boolean> = { tiptap: true };
		if (previewState.value) {
			if (mirrorX.value) classes.mirrorX = true;
			if (mirrorY.value) classes.mirrorY = true;
		}
		return classes;
	});

	// --- WebSocket Provider handling (conditionally enabled) ---
	// Keep a mutable reference to the provider so we can connect/disconnect based on settings
	// const ydoc = new Y.Doc();
	// const wsUrl = computed(() => {
	// 	const host = store.settings.websocketServer.host?.trim() || "";
	// 	if (host.startsWith("ws://") || host.startsWith("wss://")) return host;
	// 	return `ws://${host}`;
	// });

	// const provider = new HocuspocusProvider({
	// 	url: wsUrl.value,
	// 	name: "telecat",
	// 	document: ydoc
	// });

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				link: {
					openOnClick: true,
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
				inline: true,
				HTMLAttributes: {
					style: "max-width:100%;height:auto;margin:0.25rem;display:inline-block;vertical-align:middle;"
				}
			})
		],
		content: store.textContent,
		editable: !previewState.value && !store.isClientMode,
		autofocus: !previewState.value && !store.isClientMode,
		onUpdate: ({ editor }) => {
			if (store.isClientMode) return;
			store.textContent = editor.getHTML();
		}
	});

	provide(tiptapEditorKey, editor);

	// Watch for changes in previewState / client mode to toggle editability
	watch([previewState, isClientMode], ([preview, client]) => {
		if (editor.value) {
			editor.value.setEditable(!preview && !client);
		}
	});

	// If store.textContent changes externally (e.g. cleared from menu), update the editor content
	watch(() => store.textContent, (val) => {
		if (!editor.value) return;
		const current = editor.value.getHTML();
		if (val !== current) {
			// replace the editor content; use parse options to avoid errors
			editor.value.commands.setContent(val, { parseOptions: { preserveWhitespace: false } });
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
		handleExport("odt" as any);
	});

	const disposeExportPdf = onAppEvent("file:export:pdf", () => {
		handleExport("pdf" as any);
	});

	// Clean up on unmount
	onUnmounted(() => {
		// if (provider) {
		// 	try {
		// 		provider.destroy();
		// 	} catch {}
		// 	provider = null;
		// }
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
	display: inline-block;
	vertical-align: middle;
	height: auto;
	margin: 0.25rem;
	max-width: 100%;
	position: relative;
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
