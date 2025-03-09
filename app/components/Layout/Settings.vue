<template>
	<div class="SettingsBar">
		<h1>Settings</h1>

		<div class="option">
			<label for="mirrorX">MirrorX</label>
			<input id="mirrorX" v-model="mirrorX" type="checkbox">
		</div>

		<div class="option">
			<label for="mirrorY">MirrorY</label>
			<input id="mirrorY" v-model="mirrorY" type="checkbox">
		</div>

		<div class="option">
			<label for="colorPicker">Text Color:</label>
			<input id="colorPicker" v-model="colorText" type="color">
		</div>

    <div class="option">
      <label for="speed">Speed:</label>
      <input type="range" v-model="speed" min="1" max="100" class="slider" id="speed">
    </div>

    <div class="option">
      <label for="fontScale">Font Scale:</label>
      <input type="range" v-model="fontScale" min="0.1" max="6" class="slider" step="0.1" id="fontScale">
    </div>
	</div>
</template>

<script lang="ts" setup>
	import { useStore } from "@/stores/store";

	const store = useStore();
const colorText = ref(store.settings.colorText);
const fontScale = ref(store.settings.fontScale);

	watch(colorText, (newColor) => {
		store.settings.colorText = newColor;
		document.documentElement.style.setProperty("--text_color", newColor);
	});

	const mirrorX = ref(store.settings.mirroredX);
	const mirrorY = ref(store.settings.mirroredY);

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

const speed = ref(store.speed);

watch(speed, (newSpeed) => {
  store.speed = newSpeed;
})
</script>

<style>

</style>
