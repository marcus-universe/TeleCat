<template>
	<div class="SettingsBar">
		<h1>Settings</h1>

		<div class="flex_c_h gap1">
			<div class="option button flex_c_h" :class="{ active: mirrorX }" @click="store.toggleMirroredX();">
				<DesignIcons icon="mirror" customclass="mirrorX" />
			<!-- <label for="mirrorX">MirrorX:</label>
			<input id="mirrorX" v-model="mirrorX" type="checkbox"> -->
			</div>

			<div class="option button" :class="{ active: mirrorY }" @click="store.toggleMirroredY();">
				<DesignIcons icon="mirror" customclass="mirrorY" />
			<!-- <label for="mirrorY">MirrorY:</label>
			<input id="mirrorY" v-model="mirrorY" type="checkbox"> -->
			</div>

			<div class="option button" @click="openColorPicker">
				<DesignIcons icon="textcolor" customclass="textcolor" />
				<input id="colorPicker" ref="colorPicker" v-model="colorText" type="color" class="color-picker">
			</div>

			<div class="option button " @click="openColorFillPicker">
				<DesignIcons icon="fillcolor" customclass="fillcolor" />
				<input id="colorFillPicker" ref="colorFillPicker" v-model="colorBackground" type="color" class="color-fillpicker">
			</div>
		</div>

		<div class="option flex_c_h alignCenter gap1">
			<DesignIcons icon="speed" customclass="speed" />
			<input id="speed" v-model="speed" type="range" min="1" max="100" step="0.5" value="5" class="slider">
		</div>

		<div class="option flex_c_h alignCenter gap1">
			<DesignIcons icon="textsize" customclass="textsize" />
			<input id="fontScale" v-model="fontScale" type="range" min="0.1" max="20" value="5" class="slider" step="0.1">
		</div>

		<div class="option flex_c_h alignCenter gap1">
			<DesignIcons icon="padding" customclass="sidePadding" />
			<input id="sidePadding" v-model="sidePadding" type="range" min="0.4" max="30" value="5" class="slider" step="0.1">
		</div>
	</div>
</template>

<script lang="ts" setup>
	import { useStore } from "@/stores/store";

	const store = useStore();
	const colorText = ref(store.settings.colorText);
	const colorBackground = ref(store.settings.colorBackground);
	const fontScale = ref(store.settings.fontScale);
	const sidePadding = ref(store.settings.sidePadding);

	watch(colorText, (newColor) => {
		store.settings.colorText = newColor;
		document.documentElement.style.setProperty("--text_color", newColor);
	});

	watch(colorBackground, (newColor) => {
		store.settings.colorBackground = newColor;
		document.documentElement.style.setProperty("--prompt_bg", newColor);
	});

	const mirrorX = computed(() => store.settings.mirroredX);
	const mirrorY = computed(() => store.settings.mirroredY);

	watch(mirrorX, (newMirrorX) => {
		store.settings.mirroredX = newMirrorX;
		document.documentElement.style.setProperty("--mirrorX", newMirrorX ? "-1" : "1");
	});

	watch(mirrorY, (newMirrorY) => {
		store.settings.mirroredY = newMirrorY;
		document.documentElement.style.setProperty("--mirrorY", newMirrorY ? "-1" : "1");
	});

	watch(fontScale, (newFontScale) => {
		store.settings.fontScale = newFontScale;
		document.documentElement.style.setProperty("--fontSize", `${newFontScale}`);
	});

	watch(sidePadding, (newSidePadding) => {
		store.settings.sidePadding = newSidePadding;
		document.documentElement.style.setProperty("--sidePadding", `${newSidePadding}rem`);
	});

	const speed = ref(store.speed);

	watch(speed, (newSpeed) => {
		store.speed = newSpeed;
	});

	const colorPicker = ref<HTMLInputElement | null>(null);
	const colorFillPicker = ref<HTMLInputElement | null>(null);

	function openColorPicker() {
		const colorPickerElement = colorPicker.value;
		if (colorPickerElement) {
			colorPickerElement.click();
		}
	}

	function openColorFillPicker() {
		const colorFillPickerElement = colorFillPicker.value;
		if (colorFillPickerElement) {
			colorFillPickerElement.click();
		}
	}
</script>

<style>

</style>
