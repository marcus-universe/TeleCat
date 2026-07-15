<template>
	<div style="display: none" />
</template>

<script lang="ts" setup>
	import { onBeforeUnmount, onMounted } from "vue";
	import { commitImageSize, tiptapEditorKey } from "~/composables/useTiptapEditor";

	const store = useStore();
	const editorRef = inject(tiptapEditorKey);

	let currentImg: HTMLImageElement | null = null;
	let isResizing = false;
	let startX = 0;
	let startWidth = 0;
	let aspectRatio = 1;
	let syncTimer: ReturnType<typeof setTimeout> | null = null;

	function canResize(): boolean {
		return !store.isClientMode && !store.previewState;
	}

	function getEditor() {
		return editorRef?.value;
	}

	function syncImageToDocument(img: HTMLImageElement) {
		const editor = getEditor();
		if (!editor || !canResize()) return;

		const src = img.getAttribute("src") ?? "";
		const width = img.offsetWidth;
		const height = img.offsetHeight;

		if (!commitImageSize(editor, img, width, height)) return;

		store.textContent = editor.getHTML();

		if (isResizing && src) {
			nextTick(() => {
				const escaped = typeof CSS !== "undefined" && "escape" in CSS
					? CSS.escape(src)
					: src.replace(/"/g, "\\\"");
				const newImg = editor.view.dom.querySelector(`img[src="${escaped}"]`) as HTMLImageElement | null;
				if (!newImg) return;
				currentImg = newImg;
				newImg.style.outline = "2px solid var(--tc-highlight, #6038FF)";
				showHandle(newImg);
			});
		}
	}

	function scheduleSync() {
		if (!currentImg) return;
		if (syncTimer) clearTimeout(syncTimer);
		syncTimer = setTimeout(() => {
			if (currentImg) syncImageToDocument(currentImg);
		}, 100);
	}

	function showHandle(img: HTMLImageElement): void {
		document.querySelectorAll(".tc-resize-handle").forEach(el => el.remove());

		const handle = document.createElement("div");
		handle.className = "tc-resize-handle";
		handle.style.cssText = `
			position: absolute;
			width: 12px;
			height: 12px;
			background: var(--tc-highlight, #6038FF);
			border-radius: 3px;
			cursor: se-resize;
			z-index: 1000;
			box-shadow: 0 2px 4px rgba(0,0,0,0.3);
		`;

		const rect = img.getBoundingClientRect();
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

		handle.style.left = `${rect.right + scrollLeft - 6}px`;
		handle.style.top = `${rect.bottom + scrollTop - 6}px`;

		document.body.appendChild(handle);
		handle.addEventListener("mousedown", startResize);
	}

	function hideHandle(): void {
		document.querySelectorAll(".tc-resize-handle").forEach(el => el.remove());
		if (currentImg) {
			currentImg.style.outline = "none";
			currentImg = null;
		}
	}

	function startResize(e: MouseEvent): void {
		e.preventDefault();
		if (!currentImg || !canResize()) return;

		isResizing = true;
		startX = e.clientX;
		startWidth = currentImg.offsetWidth;
		aspectRatio = currentImg.offsetWidth / currentImg.offsetHeight;

		document.addEventListener("mousemove", doResize);
		document.addEventListener("mouseup", stopResize);
	}

	function doResize(e: MouseEvent): void {
		if (!isResizing || !currentImg) return;

		const deltaX = e.clientX - startX;
		const newWidth = Math.max(50, startWidth + deltaX);
		const newHeight = newWidth / aspectRatio;

		currentImg.style.width = `${newWidth}px`;
		currentImg.style.height = `${newHeight}px`;
		showHandle(currentImg);
		scheduleSync();
	}

	function stopResize(): void {
		isResizing = false;
		document.removeEventListener("mousemove", doResize);
		document.removeEventListener("mouseup", stopResize);

		if (syncTimer) {
			clearTimeout(syncTimer);
			syncTimer = null;
		}

		if (currentImg) {
			syncImageToDocument(currentImg);
		}
	}

	function onImageClick(e: MouseEvent): void {
		if (!canResize()) {
			hideHandle();
			return;
		}

		const target = e.target as HTMLElement;
		const img = target.closest("img") as HTMLImageElement;

		if (img && img.closest(".ProseMirror")) {
			currentImg = img;
			img.style.outline = "2px solid var(--tc-highlight, #6038FF)";
			showHandle(img);
		} else {
			hideHandle();
		}
	}

	onMounted(() => {
		document.addEventListener("click", onImageClick);
	});

	onBeforeUnmount(() => {
		document.removeEventListener("click", onImageClick);
		if (syncTimer) clearTimeout(syncTimer);
		hideHandle();
	});
</script>
