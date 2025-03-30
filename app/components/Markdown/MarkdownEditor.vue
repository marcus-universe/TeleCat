<template>
	<EditorContent :editor="editor" />
</template>

<script lang="ts" setup>
	import { useStore } from "@/stores/store";
	import { HocuspocusProvider } from "@hocuspocus/provider";
	// import { Editor } from "@tiptap/core";
	import Collaboration from "@tiptap/extension-collaboration";
	import Highlight from "@tiptap/extension-highlight";
	import StarterKit from "@tiptap/starter-kit";
	import { EditorContent, useEditor } from "@tiptap/vue-3";

	const store = useStore();
	const websocketServer = computed(() => store.settings.websocketServer);

	const previewState = computed(() => store.previewState);
	// Initialize the provider
	const provider = new HocuspocusProvider({
		url: `ws://${websocketServer.value.host}:${websocketServer.value.port}`,
		name: "telecat"
	});
	// Create the editor with the Y.js document
	const editor = useEditor({
		extensions: [
			StarterKit,
			Highlight.configure({ multicolor: true }),
			Collaboration.configure({
				document: provider.document
			})
		],
		content: store.textContent,
		editable: !previewState.value,
		autofocus: !previewState.value
	});

	watch(previewState, (value) => {
		if (editor.value) {
			editor.value.setEditable(!value);
		}
	});

	// Clean up on unmount
	onUnmounted(() => {
	});
</script>

<style>
/* Fügen Sie hier Ihre Stile hinzu */
</style>
