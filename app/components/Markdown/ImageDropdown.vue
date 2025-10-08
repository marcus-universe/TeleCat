<template>
	<div ref="container" class="image-dropdown-container" @click.stop>
		<button
			type="button"
			title="Bild einfügen"
			aria-haspopup="true"
			:aria-expanded="open"
			@click="toggle"
		>
			<Icons icon="image" customclass="icon" />
		</button>

		<!-- Fixed-position panel to avoid being clipped by parents -->
		<div
			v-if="open"
			class="image-dropdown-panel"
		>
			<div class="image-dropdown">
				<button type="button" @click="addFromUrl">
					Von URL
				</button>
				<button type="button" @click="triggerFile">
					Datei hochladen
				</button>
			</div>
		</div>

		<input
			ref="fileInput"
			type="file"
			accept="image/png, image/jpeg, image/gif"
			style="display: none"
			@change="onFileChange"
		>
	</div>
</template>

<script lang="ts" setup>
	import { onBeforeUnmount, onMounted, ref } from "vue";
	import Icons from "~/components/Design/Icons.vue";

	const props = defineProps<{ editor: any }>();

	const open = ref(false);
	const container = ref<HTMLElement | null>(null);
	const fileInput = ref<HTMLInputElement | null>(null);

	function toggle() {
		const willOpen = !open.value;
		open.value = willOpen;
	}

	function close() {
		open.value = false;
	}

	function addFromUrl() {
		// eslint-disable-next-line no-alert
		const url = window.prompt("Bild-URL eingeben");
		if (url) {
			props.editor?.chain()?.focus()?.setImage?.({ src: url })?.run();
		}
		close();
	}

	function triggerFile() {
		fileInput.value?.click();
	}

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (ev) => {
			const src = ev.target?.result as string;
			if (src) {
				props.editor?.chain()?.focus()?.setImage?.({ src })?.run();
			}
			close();
		};
		reader.readAsDataURL(file);
		input.value = "";
	}

	function onClickOutside(ev: MouseEvent) {
		const el = container.value;
		if (el && !el.contains(ev.target as Node)) {
			close();
		}
	}

	onMounted(() => {
		document.addEventListener("click", onClickOutside);
	});

	onBeforeUnmount(() => {
		document.removeEventListener("click", onClickOutside);
	});
</script>

<style scoped lang="scss">
.image-dropdown-container {
	position: relative;
	display: inline-block;
}

/* Trigger button appearance */
.image-dropdown-container > button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 36px;
	padding: 0.25rem;
	border-radius: 6px;
	border: 1px solid var(--border-color);
	background-color: var(--button-background, rgba(0, 0, 0, 0.03));
	color: var(--color_p);
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	transition: transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
}
.image-dropdown-container > button:hover {
	background-color: var(--hover-background-color);
	transform: translateY(-1px);
}
.image-dropdown-container > button[aria-expanded="true"] {
	background-color: rgb(var(--color_bg));
	box-shadow: 0 4px 12px rgb(var(--color_bg));
}
.image-dropdown-container > button:focus {
	outline: 3px solid rgba(0, 123, 255, 0.15);
	outline-offset: 2px;
}
.image-dropdown-container .icon {
	color: var(--color_p);
}
/* Enforce SVG fill/stroke for the icon to avoid black color overrides */
.image-dropdown-container > button .icon,
.image-dropdown-container > button .icon *,
.image-dropdown-container > button svg,
.image-dropdown-container > button svg *,
.image-dropdown-container > button svg path,
.image-dropdown-container > button svg use {
	fill: var(--color_p) !important;
	stroke: var(--color_p) !important;
	color: var(--color_p) !important;
}

/* The floating panel */
.image-dropdown-panel {
	position: fixed;
	z-index: 6;
}

/* Dropdown content */
.image-dropdown {
	display: flex;
	flex-direction: column;
	min-width: 140px;
	padding: 0.5rem;
	background-color: rgba(var(--color_bg), 0.9);
	border: 1px solid var(--border-color);
	border-radius: var(--border-radius);
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.16);

	button {
		width: 100%;
		padding: 0.5rem;
		text-align: left;
		background: none;
		border: none;
		color: var(--color_p);

		&:hover {
			background-color: var(--color_p);
			color: var(--color_bg);
		}
	}
}
</style>
