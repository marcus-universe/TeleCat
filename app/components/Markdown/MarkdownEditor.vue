<template>
	<div class="markdown-editor" :style="{ '--tc-highlight': store.settings.colorHighlight }">
		<EditBar :editor="editor" :show="!!editor && !previewState" />
		<EditorContent :editor="editor" />
	</div>
</template>

<script lang="ts" setup>
	import { HocuspocusProvider } from "@hocuspocus/provider";
	// import Collaboration from "@tiptap/extension-collaboration";
	import Highlight from "@tiptap/extension-highlight";
	import Link from "@tiptap/extension-link";
	import { Node, mergeAttributes } from "@tiptap/core";
	import StarterKit from "@tiptap/starter-kit";
	import { EditorContent, useEditor } from "@tiptap/vue-3";
	import EditBar from "~/components/Markdown/EditBar.vue";
	import * as Y from "yjs";

	// Define an Image node with support for width/height attributes and a resize handle via NodeView
	const ImageWithSize = Node.create({
		name: "image",
		inline: false,
		group: "block",
		draggable: true,
		atom: true,
		addAttributes() {
			return {
				src: {
					default: null
				},

				alt: {
					default: null
				},
				title: {
					default: null
				},
				width: {
					default: null,
					parseHTML: (element: HTMLElement) => element.getAttribute("width") || (element.style.width?.replace("px", "") || null),
					renderHTML: (attrs: Record<string, any>) => attrs.width ? { width: String(attrs.width) } : {}
				},
				height: {
					default: null,
					parseHTML: (element: HTMLElement) => element.getAttribute("height") || (element.style.height?.replace("px", "") || null),
					renderHTML: (attrs: Record<string, any>) => attrs.height ? { height: String(attrs.height) } : {}
				}
			};
		},
		parseHTML() {
			return [{ tag: "img[src]" }];
		},
		renderHTML({ HTMLAttributes }) {
			return ["img", mergeAttributes(HTMLAttributes)];
		},
		addNodeView() {
			return ({ node, editor, getPos }) => {
				// Wrapper with relative positioning
				const wrapper = document.createElement('div');
				wrapper.className = 'tc-image-wrapper';
				wrapper.style.display = 'inline-block';
				wrapper.style.position = 'relative';
				// Enable dragging the image node to move it within the editor
				wrapper.setAttribute('draggable', 'true');

				// The actual image element
				const img = document.createElement('img');
				// Prevent default browser drag on the raw <img>, we want the wrapper to handle it
				img.setAttribute('draggable', 'false');
				const attrs = node.attrs as Record<string, any>;
				if (attrs.src) img.setAttribute('src', attrs.src);
				if (attrs.alt) img.setAttribute('alt', attrs.alt);
				if (attrs.title) img.setAttribute('title', attrs.title);
				if (attrs.width) img.setAttribute('width', String(attrs.width));
				if (attrs.height) img.setAttribute('height', String(attrs.height));
				wrapper.appendChild(img);

				// Resize handle
				const handle = document.createElement('span');
				handle.className = 'tc-image-resize-handle';
				handle.title = 'Größe ändern';
				wrapper.appendChild(handle);

				// Drag-resize logic
				let startX = 0;
				let startY = 0;
				let startWidth = 0;

				const onPointerMove = (ev: MouseEvent) => {
					const dx = ev.clientX - startX;
					// Optionally include dy for diagonal feel
					// const dy = ev.clientY - startY;
					let newWidth = Math.round(startWidth + dx);
					newWidth = Math.max(20, Math.min(3000, newWidth));
					// Update DOM immediately for responsiveness
					img.setAttribute('width', String(newWidth));
				};

				const commitWidth = (width: number) => {
					const pos = typeof getPos === 'function' ? getPos() : null;
					if (pos == null) return;
					const { state, view } = editor;
					const tr = state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, width });
					view.dispatch(tr);
				};

				const onPointerUp = (ev: MouseEvent) => {
					window.removeEventListener('mousemove', onPointerMove);
					window.removeEventListener('mouseup', onPointerUp);
					const currentWidth = parseInt(img.getAttribute('width') || '0', 10) || startWidth;
					commitWidth(currentWidth);
				};

				const onPointerDown = (ev: MouseEvent) => {
					if (!editor.isEditable) return;
					ev.preventDefault();
					ev.stopPropagation();
					startX = ev.clientX;
					startY = ev.clientY;
					// Determine starting width from attribute or rendered size
					const attrW = parseInt(String((node.attrs as any).width || 0), 10);
					startWidth = attrW || Math.round(img.getBoundingClientRect().width) || 600;
					window.addEventListener('mousemove', onPointerMove);
					window.addEventListener('mouseup', onPointerUp);
					// Ensure the image node is selected/focused
					const pos = typeof getPos === 'function' ? getPos() : null;
					if (pos != null) {
						editor.chain().focus().setNodeSelection(pos).run();
					} else {
						editor.chain().focus().run();
					}
				};

				handle.addEventListener('mousedown', onPointerDown);
				// Don't allow the handle itself to start a DOM drag
				handle.setAttribute('draggable', 'false');

				// Ensure node is selected on drag start so ProseMirror moves it
				const onDragStart = (ev: DragEvent) => {
					const pos = typeof getPos === 'function' ? getPos() : null;
					if (pos != null) {
						editor.chain().focus().setNodeSelection(pos).run();
					}
				};
				wrapper.addEventListener('dragstart', onDragStart);

				// Pre-select node on mousedown (except on the resize handle) so PM attaches correct drag slice
				const onWrapperMouseDown = (ev: MouseEvent) => {
					if (!editor.isEditable) return;
					// ignore clicks that start on the handle
					if (ev.target === handle) return;
					const pos = typeof getPos === 'function' ? getPos() : null;
					if (pos != null) {
						editor.chain().focus().setNodeSelection(pos).run();
					}
				};
				wrapper.addEventListener('mousedown', onWrapperMouseDown);

				return {
					dom: wrapper,
					update: (updatedNode) => {
						if (updatedNode.type.name !== 'image') return false;
						const a = updatedNode.attrs as Record<string, any>;
						// Update attributes when node changes
						if (a.src) img.setAttribute('src', a.src); else img.removeAttribute('src');
						if (a.alt) img.setAttribute('alt', a.alt); else img.removeAttribute('alt');
						if (a.title) img.setAttribute('title', a.title); else img.removeAttribute('title');
						if (a.width) img.setAttribute('width', String(a.width)); else img.removeAttribute('width');
						if (a.height) img.setAttribute('height', String(a.height)); else img.removeAttribute('height');
						// Keep selection class in sync
						const { state } = editor;
						const sel: any = state.selection as any;
						const isSelected = !!sel && !!sel.node && sel.node.eq(updatedNode);
						wrapper.classList.toggle('is-selected', !!isSelected);
						return true;
					},
					selectNode() {
						wrapper.classList.add('is-selected');
					},
					deselectNode() {
						wrapper.classList.remove('is-selected');
					},
					destroy: () => {
						handle.removeEventListener('mousedown', onPointerDown);
						wrapper.removeEventListener('dragstart', onDragStart);
						wrapper.removeEventListener('mousedown', onWrapperMouseDown);
						window.removeEventListener('mousemove', onPointerMove);
						window.removeEventListener('mouseup', onPointerUp);
					}
				};
			};
		}
	});

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
			Highlight.configure({ multicolor: true }),
			// Cast to any to satisfy TS in NodeNext resolution
			(Link as any).configure({
				openOnClick: true,
				defaultProtocol: 'https',
				autolink: true,
				linkOnPaste: true,
				HTMLAttributes: {
					rel: 'noopener noreferrer nofollow',
					target: '_blank'
				}
			}),
			ImageWithSize
			// Collaboration.configure({
			// 	document: provider.document
			// })
		],
		content: store.textContent,
		editable: !previewState.value,
		autofocus: !previewState.value,
		onUpdate: ({ editor }) => {
			// Persist the editor content as HTML so it matches the format in the store
			store.textContent = editor.getHTML();
		},
		editorProps: {
			handleClick(_view, _pos, event) {
				// In edit mode prevent navigating away when clicking links
				if (editor.value?.isEditable) {
					const anchor = (event.target as HTMLElement | null)?.closest('a');
					if (anchor) {
						event.preventDefault();
						return true; // handled
					}
				}
				return false;
			},
			handleKeyDown(view, event) {
				// Shortcut: Ctrl/Cmd+K to set/unset link
				if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
					const prev = editor.value?.getAttributes('link')?.href as string | undefined;
					const url = window.prompt('URL', prev || '') ?? null;
					if (url === null) return true; // canceled
					if (url === '') {
						(editor.value as any)?.chain().focus().extendMarkRange('link').unsetLink().run();
						return true;
					}
					(editor.value as any)?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
					return true;
				}
				// If an image node is selected and the user types a character or presses Enter,
				// move the caret after the image instead of replacing the node.
				const sel: any = view.state.selection as any;
				const isNodeSelection = !!sel && !!sel.node && sel.node.type && sel.node.type.name === 'image';
				const isModifier = (event.ctrlKey || event.metaKey || event.altKey);
				const isPrintable = event.key && event.key.length === 1;
				const isEnter = event.key === 'Enter';
				if (isNodeSelection && !isModifier && (isPrintable || isEnter)) {
					const posAfter = sel.from + 1; // position right after the node
					// Place caret after the node, then let default text insertion happen
					(view as any).someProp ? null : null; // no-op to satisfy TS when not using prosemirror types
					editor.value?.chain().setTextSelection({ from: posAfter, to: posAfter }).run();
					return false;
				}
				return false;
			},
			handleDrop(view, event, _slice, _moved) {
				if (!editor.value?.isEditable) return false;
				const dt = (event as DragEvent).dataTransfer;
				if (!dt || !dt.files || dt.files.length === 0) return false;
				const imageFiles = Array.from(dt.files).filter(f => f.type.startsWith("image/"));
				if (imageFiles.length === 0) return false;

				event.preventDefault();
				const pos = view.posAtCoords({ left: (event as DragEvent).clientX, top: (event as DragEvent).clientY })?.pos ?? null;

				imageFiles.forEach((file, index) => {
					const reader = new FileReader();
					reader.onload = () => {
						const src = reader.result as string;
						const content = { type: "image", attrs: { src, alt: file.name, width: 600 } } as const;
						if (pos != null) {
							// Slightly offset subsequent images so order is preserved
							const insertPos = pos + index;
							editor.value?.chain().focus().insertContentAt(insertPos, content).run();
						} else {
							editor.value?.chain().focus().insertContent(content).run();
						}
					};
					reader.readAsDataURL(file);
				});

				return true; // We handled the drop
			},
			handlePaste(_view, event) {
				if (!editor.value?.isEditable) return false;
				const items = (event as ClipboardEvent).clipboardData?.items;
				if (!items || items.length === 0) return false;
				const images = Array.from(items).filter(i => i.type.startsWith("image/"));
				if (images.length === 0) return false;
				event.preventDefault();
				images.forEach(item => {
					const file = item.getAsFile();
					if (!file) return;
					const reader = new FileReader();
					reader.onload = () => {
						const src = reader.result as string;
						editor.value?.chain().focus().insertContent({ type: "image", attrs: { src, alt: file.name, width: 600 } }).run();
					};
					reader.readAsDataURL(file);
				});
				return true;
			}
		}
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

	// BubbleMenu removed in favor of resize handle on the node itself

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

/* Image rendering inside the editor */
.ProseMirror img {
	display: block;
	max-width: 100%;
	height: auto;
	margin: 1rem 0;
}
.ProseMirror img.ProseMirror-selectednode {
	outline: 3px solid var(--tc-highlight, #6038FF);
}

/* Wrapper and resize handle for image NodeView */
.tc-image-wrapper {
	position: relative;
}
.tc-image-wrapper.is-selected img {
	outline: 3px solid var(--tc-highlight, #6038FF);
	outline-offset: 2px;
}
.tc-image-wrapper img {
	display: block;
	height: auto;
	max-width: 100%;
}
.tc-image-wrapper .tc-image-resize-handle {
	position: absolute;
	right: -6px;
	bottom: -6px;
	width: 12px;
	height: 12px;
	background: var(--tc-highlight, #6038FF);
	border: 2px solid #fff;
	border-radius: 2px;
	box-shadow: 0 1px 3px rgba(0,0,0,0.3);
	cursor: se-resize;
	opacity: 0.0;
	transition: opacity 0.15s ease-in-out;
}
.tc-image-wrapper:hover .tc-image-resize-handle,
.ProseMirror-hideselection .tc-image-wrapper .tc-image-resize-handle,
.ProseMirror-selectednode + .tc-image-resize-handle {
	opacity: 1.0;
}
/* Hide handle in readonly mode */
.ProseMirror[contenteditable="false"] .tc-image-resize-handle {
	display: none;
}

/* Optional: more visible drop cursor */
.ProseMirror-dropcursor {
	position: relative;
}
.ProseMirror-dropcursor:after {
	content: "";
	position: absolute;
	left: 0;
	right: 0;
	height: 2px;
	background: var(--tc-highlight, #6038FF);
}

/* Text selection color inside editor */
.ProseMirror ::selection {
	background: var(--tc-highlight, #6038FF);
	color: #fff;
}
.ProseMirror ::-moz-selection {
	background: var(--tc-highlight, #6038FF);
	color: #fff;
}

/* Link styles */
.ProseMirror a {
	color: var(--tc-highlight, #6038FF);
	text-decoration: underline;
	cursor: pointer;
}
.ProseMirror a:hover {
	filter: brightness(1.1);
}

</style>
