<template>
	<!-- invisible mounting component -->
	<div style="display: none" />
</template>

<script lang="ts" setup>
	import { onBeforeUnmount, onMounted } from "vue";

	let handle: HTMLDivElement | null = null;
	let currentImg: HTMLImageElement | null = null;
	let startX = 0;
	let _startY = 0; // prefixed to avoid unused var lint
	let startW = 0;
	let startH = 0;
	let aspect = 1;

	function createHandle(): void {
		handle = document.createElement("div");
		handle.className = "tc-image-resize-handle";
		handle.style.position = "absolute";
		handle.style.width = "12px";
		handle.style.height = "12px";
		handle.style.borderRadius = "3px";
		handle.style.background = "var(--color_p)";
		handle.style.zIndex = "99999";
		handle.style.cursor = "nwse-resize";
		handle.style.boxShadow = "0 1px 4px rgba(0,0,0,0.2)";
		document.body.appendChild(handle);

		handle.addEventListener("pointerdown", onPointerDown);
	}

	function removeHandle(): void {
		if (handle) {
			handle.removeEventListener("pointerdown", onPointerDown);
			if (handle.parentNode) handle.parentNode.removeChild(handle);
			handle = null;
		}
	}

	function positionHandleFor(img: HTMLImageElement): void {
		if (!handle) createHandle();
		if (!handle) return;
		const rect = img.getBoundingClientRect();
		const left = rect.right - 8;
		const top = rect.bottom - 8;
		handle.style.left = `${left}px`;
		handle.style.top = `${top}px`;
	}

	function onPointerDown(ev: PointerEvent): void {
		ev.preventDefault();
		if (!currentImg) return;
		startX = ev.clientX;
		_startY = ev.clientY;
		startW = currentImg.getBoundingClientRect().width;
		startH = currentImg.getBoundingClientRect().height;
		aspect = startW / startH || 1;
		// ensure the image can be sized freely
		currentImg.style.maxWidth = "none";
		currentImg.style.boxSizing = "border-box";

		window.addEventListener("pointermove", onPointerMove);
		window.addEventListener("pointerup", onPointerUp, { once: true });
	}

	function onPointerMove(ev: PointerEvent): void {
		if (!currentImg) return;
		const dx = ev.clientX - startX;
		// resize maintaining aspect ratio
		const newW = Math.max(16, startW + dx);
		const newH = Math.round(newW / aspect);
		currentImg.style.width = `${newW}px`;
		currentImg.style.height = `${newH}px`;
		// reposition handle
		positionHandleFor(currentImg);
	}

	function onPointerUp(): void {
		window.removeEventListener("pointermove", onPointerMove);
		// leave the inline width/height so layout persists
	}

	function clearSelection(): void {
		if (currentImg) {
			currentImg.classList.remove("tc-image-selected");
			currentImg = null;
		}
		if (handle) {
			handle.style.left = "-9999px";
			handle.style.top = "-9999px";
		}
	}

	function onMouseOver(ev: MouseEvent): void {
		const target = ev.target as HTMLElement;
		if (!target) return;
		const img = target.closest("img") as HTMLImageElement | null;
		if (img && img.closest(".ProseMirror")) {
			currentImg = img;
			img.classList.add("tc-image-selected");
			positionHandleFor(img);
		}
	}

	function onClick(ev: MouseEvent): void {
		const target = ev.target as HTMLElement;
		const img = target.closest("img") as HTMLImageElement | null;
		if (!img || !img.closest(".ProseMirror")) {
			clearSelection();
			return;
		}
		// select image
		clearSelection();
		currentImg = img;
		img.classList.add("tc-image-selected");
		positionHandleFor(img);
	}

	onMounted(() => {
		document.addEventListener("mouseover", onMouseOver);
		document.addEventListener("click", onClick);
	});

	onBeforeUnmount(() => {
		document.removeEventListener("mouseover", onMouseOver);
		document.removeEventListener("click", onClick);
		removeHandle();
	});
</script>

<style scoped>
  .tc-image-selected {
    outline: 2px solid var(--color_p);
    outline-offset: 2px;
  }
  .tc-image-resize-handle {
    touch-action: none;
  }
</style>
