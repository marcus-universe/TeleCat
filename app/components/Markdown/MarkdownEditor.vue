<template>
	<EditorContent :editor="editor" />
</template>

<script lang="ts" setup>
	import { HocuspocusProvider } from "@hocuspocus/provider";
	import Collaboration from "@tiptap/extension-collaboration";
	import Highlight from "@tiptap/extension-highlight";
	import StarterKit from "@tiptap/starter-kit";
	import { EditorContent, useEditor } from "@tiptap/vue-3";
	import * as Y from "yjs";

	const store = useStore();
	const websocketServer = computed(() => store.settings.websocketServer);

	const previewState = computed(() => store.previewState);

	// Reactive provider reference
	let provider = new HocuspocusProvider({
		url: `ws://${websocketServer.value.host}`,
		name: "telecat",
		document: new Y.Doc(),
		onConnect() {
			store.setWebsocketConnected(true);
		},
		onDisconnect() {
			store.setWebsocketConnected(false);
		},
		onAuthenticationFailed: () => {
			store.setWebsocketConnected(false);
		}
	});

	provider.on("status", (status: any) => {
		console.log("Provider status:", status);
	});

	// Create the editor with the Y.js document
	const editor = useEditor({
		extensions: [
			StarterKit,
			Highlight.configure({ multicolor: true })
			// Collaboration.configure({
			// 	document: provider.document
			// })
		],
		content: store.textContent,
		editable: !previewState.value,
		autofocus: !previewState.value
	});

	// Watch for changes in websocketServer and recreate the provider
	watch(store.settings.websocketServer.host, () => {
		// Destroy the current provider to close the WebSocket connection
		provider.destroy();

		// Create a new provider instance with the updated URL
		const newProvider = new HocuspocusProvider({
			url: `ws://${store.settings.websocketServer.host}`, // The new WebSocket server URL
			name: "telecat" // Your document name
			// Include other necessary configurations here
		});

		// Optionally, set up event listeners for the new provider
		newProvider.on("connect", () => {
			console.log("Connected to the new WebSocket server.");
		});

		// Update the reference to the current provider
		provider = newProvider;
	});

	// Watch for changes in previewState to toggle editability
	watch(previewState, (value) => {
		if (editor.value) {
			editor.value.setEditable(!value);
		}
	});

	// Clean up on unmount
	onUnmounted(() => {
		if (provider) {
			provider.destroy();
		}
	});
</script>

<style>
/* Fügen Sie hier Ihre Stile hinzu */
</style>
