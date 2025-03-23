<template>
	<EditorContent :editor="editor" />
</template>

<script lang="ts" setup>
	import { useStore } from "@/stores/store";
	import { HocuspocusProvider } from "@hocuspocus/provider";
	import Collaboration from "@tiptap/extension-collaboration";
	import Highlight from "@tiptap/extension-highlight";
	import StarterKit from "@tiptap/starter-kit";
	import { EditorContent, useEditor } from "@tiptap/vue-3";
	// Registered with a WebRTC provider

	const store = useStore();
	const websocketServer = computed(() => store.settings.websocketServer);
	const provider = new HocuspocusProvider({
		url: websocketServer.value,
		name: "example-document"
	});
	const previewState = computed(() => store.previewState);
	const editor = useEditor({
		extensions: [
			StarterKit,
			Highlight.configure({ multicolor: true }),
			Collaboration.configure({
				document: provider.document
			})
		],
		content: "<p>this is a test</p>",
		editable: !previewState.value,
		autofocus: !previewState.value
	});

	watch(previewState, (value) => {
		if (editor.value) {
			editor.value.setEditable(!value);
		}
	});
</script>

<style>
/* Fügen Sie hier Ihre Stile hinzu */
</style>
