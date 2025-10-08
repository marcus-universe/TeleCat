<template>
	<div style="display: none" />
</template>

<script lang="ts" setup>
	import { onBeforeUnmount, onMounted } from "vue";

	let currentImg: HTMLImageElement | null = null;
	let isResizing = false;
	let startX = 0;
	let startWidth = 0;
	let aspectRatio = 1;

	function showHandle(img: HTMLImageElement): void {
		// Remove existing handles
		document.querySelectorAll(".tc-resize-handle").forEach((el) => el.remove());

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

		// Position handle at bottom-right corner
		const rect = img.getBoundingClientRect();
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

		handle.style.left = `${rect.right + scrollLeft - 6}px`;
		handle.style.top = `${rect.bottom + scrollTop - 6}px`;

		document.body.appendChild(handle);

		handle.addEventListener("mousedown", startResize);
	}

	function hideHandle(): void {
		document.querySelectorAll(".tc-resize-handle").forEach((el) => el.remove());
		if (currentImg) {
			currentImg.style.outline = "none";
			currentImg = null;
		}
	}

	function startResize(e: MouseEvent): void {
		e.preventDefault();
		if (!currentImg) return;

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

		// Update handle position
		showHandle(currentImg);
	}

	function stopResize(): void {
		isResizing = false;
		document.removeEventListener("mousemove", doResize);
		document.removeEventListener("mouseup", stopResize);
	}

	function onImageClick(e: MouseEvent): void {
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
		hideHandle();
	});
</script>
