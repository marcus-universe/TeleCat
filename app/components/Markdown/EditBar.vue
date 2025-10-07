<template>
	<!-- Render only when shown and editor available -->
	<div v-if="show && editor">
		<!-- Fixed toolbar -->
		<div class="tc-editbar" role="toolbar" aria-label="Textformatierung">
			<div class="button-group">
				<button
					type="button"
					:class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
					:aria-pressed="editor.isActive('heading', { level: 1 })"
					@click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
				>
					H1
				</button>
				<button
					type="button"
					:class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
					:aria-pressed="editor.isActive('heading', { level: 2 })"
					@click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
				>
					H2
				</button>
				<button
					type="button"
					:class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
					:aria-pressed="editor.isActive('heading', { level: 3 })"
					@click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
				>
					H3
				</button>
				<button
					type="button"
					:class="{ 'is-active': editor.isActive('paragraph') }"
					:aria-pressed="editor.isActive('paragraph')"
					@click="editor.chain().focus().setParagraph().run()"
				>
					P
				</button>

				<span class="divider" aria-hidden="true" />

				<button
					type="button"
					:disabled="!editor.can().chain().focus().toggleBold().run()"
					:class="{ 'is-active': editor.isActive('bold') }"
					:aria-pressed="editor.isActive('bold')"
					title="Bold"
					@click="editor.chain().focus().toggleBold().run()"
				>
					<Icons icon="bold" customclass="icon" />
				</button>
				<button
					type="button"
					:disabled="!editor.can().chain().focus().toggleItalic().run()"
					:class="{ 'is-active': editor.isActive('italic') }"
					:aria-pressed="editor.isActive('italic')"
					title="Italic"
					@click="editor.chain().focus().toggleItalic().run()"
				>
					<Icons icon="italic" customclass="icon" />
				</button>
				<button
					type="button"
					:disabled="!editor.can().chain().focus().toggleStrike().run()"
					:class="{ 'is-active': editor.isActive('strike') }"
					:aria-pressed="editor.isActive('strike')"
					title="Strike"
					@click="editor.chain().focus().toggleStrike().run()"
				>
					<Icons icon="strike" customclass="icon" />
				</button>

				<button
					type="button"
					:disabled="!editor.can().chain().focus().toggleHighlight().run()"
					:class="{ 'is-active': editor.isActive('highlight') }"
					:aria-pressed="editor.isActive('highlight')"
					title="Mark"
					@click="editor.chain().focus().toggleHighlight().run()"
				>
					<Icons icon="mark" customclass="icon" />
				</button>

				<button
					type="button"
					:class="{ 'is-active': editor.isActive('codeBlock') }"
					:aria-pressed="editor.isActive('codeBlock')"
					title="Codeblock"
					@click="editor.chain().focus().toggleCodeBlock().run()"
				>
					<Icons icon="code" customclass="icon" />
				</button>
				<button
					type="button"
					:class="{ 'is-active': editor.isActive('blockquote') }"
					:aria-pressed="editor.isActive('blockquote')"
					title="Blockquote"
					@click="editor.chain().focus().toggleBlockquote().run()"
				>
					<Icons icon="blockquote" customclass="icon" />
				</button>

				<button
					type="button"
					:class="{ 'is-active': editor.isActive('bulletList') }"
					:aria-pressed="editor.isActive('bulletList')"
					title="Bullet List"
					@click="editor.chain().focus().toggleBulletList().run()"
				>
					<Icons icon="bulletlist" customclass="icon" />
				</button>
				<button
					type="button"
					:class="{ 'is-active': editor.isActive('orderedList') }"
					:aria-pressed="editor.isActive('orderedList')"
					title="Ordered List"
					@click="editor.chain().focus().toggleOrderedList().run()"
				>
					<Icons icon="orderedlist" customclass="icon" />
				</button>

				<span class="divider" aria-hidden="true" />

				<!-- Insert Image Button (URL prompt like Tiptap docs) -->
				<button
					type="button"
					:disabled="!editor?.isEditable"
					title="Bild von URL einfügen"
					@click="addImageFromUrl"
				>
					Bild (URL)
				</button>
			</div>
		</div>

		<!-- Spacer to avoid overlap with fixed bar -->
		<div class="tc-editbar-spacer" aria-hidden="true" />
	</div>
</template>

<script lang="ts" setup>
	import Icons from "~/components/Design/Icons.vue";
	// Accept the TipTap editor instance and visibility flag
	const props = defineProps<{ editor: any, show: boolean }>();

	function addImageFromUrl() {
		// eslint-disable-next-line no-alert
		const url = window.prompt("Bild-URL eingeben");
		if (!url) return;
		// Use Tiptap's setImage command
		props.editor?.chain()?.focus()?.setImage?.({ src: url })?.run();
	}
</script>
