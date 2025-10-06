<template>
	<div class="markdown-editor">
		<EditBar :editor="editor" :show="!!editor && !previewState" />
		<EditorContent :editor="editor" />
	</div>
</template>

<script lang="ts" setup>
	import { HocuspocusProvider } from "@hocuspocus/provider";
	// import Collaboration from "@tiptap/extension-collaboration";
	import Highlight from "@tiptap/extension-highlight";
	import StarterKit from "@tiptap/starter-kit";
	import { EditorContent, useEditor } from "@tiptap/vue-3";
	import EditBar from "~/components/Markdown/EditBar.vue";
	import * as Y from "yjs";

	const store = useStore();
	// const websocketServer = computed(() => store.settings.websocketServer);

	const previewState = computed(() => store.previewState);

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
			try { provider.destroy(); } catch {}
			provider = null;
		}
		provider = new HocuspocusProvider({
			url: wsUrl.value,
			name: "telecat",
			document: ydoc,
			// Do not auto-connect when the toggle is off
			connect: true
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
					try { provider.destroy(); } catch {}
					provider = null;
				}
				store.setWebsocketConnected(false);
			}
		},
		{ immediate: true }
	);

	// Create the editor with the Y.js document
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				// Add any specific configuration for StarterKit here
				// Enable history so STRG+Z works in editor mode
				history: {}
			}),
			Highlight.configure({ multicolor: true })
			// Collaboration.configure({
			// 	document: provider.document
			// })
		],
		content: store.textContent,
		editable: !previewState.value,
		autofocus: !previewState.value
	});

	// // Watch for changes in websocketServer and recreate the provider
	// watch(store.settings.websocketServer.host, () => {
	// 	// Destroy the current provider to close the WebSocket connection
	// 	provider.destroy();

	// 	// Create a new provider instance with the updated URL
	// 	const newProvider = new HocuspocusProvider({
	// 		url: `ws://${store.settings.websocketServer.host}`, // The new WebSocket server URL
	// 		name: "telecat" // Your document name
	// 		// Include other necessary configurations here
	// 	});

	// 	// Optionally, set up event listeners for the new provider
	// 	newProvider.on("connect", () => {
	// 		console.log("Connected to the new WebSocket server.");
	// 	});

	// 	// Update the reference to the current provider
	// 	provider = newProvider;
	// });

	// Watch for changes in previewState to toggle editability
	watch(previewState, (value) => {
		if (editor.value) {
			editor.value.setEditable(!value);
		}
	});

	// Clean up on unmount
	onUnmounted(() => {
		if (provider) {
			try { provider.destroy(); } catch {}
			provider = null;
		}
	});
</script>

<style>
.markdown-editor {
	display: flex;
	flex-direction: column;
}
</style>
