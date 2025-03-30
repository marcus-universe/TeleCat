<template>
	<div ref="SettingsBar" class="SettingsBar">
		<h1>Settings</h1>

		<ul class="settingsTabs flex_c_h">
			<li v-for="(tab, index) in tabs" :key="index" class="settingTab" :class="{ active: tab.active }" @click="setActiveTab(index)">
				{{ tab.name }}
			</li>
		</ul>
		<div v-if="tabs && tabs[0] && tabs[0].active" class="generalSettings">
			<div class="flex_c_h gap1">
				<div class="option button flex_c_h" :class="{ active: mirrorX }" @click="store.toggleMirroredX();">
					<DesignIcons icon="mirror" customclass="mirrorX" />
				</div>

				<div class="option button" :class="{ active: mirrorY }" @click="store.toggleMirroredY();">
					<DesignIcons icon="mirror" customclass="mirrorY" />
				</div>
			</div>

			<div class="option flex_c_h alignCenter gap1">
				<DesignIcons icon="speed" customclass="speed" />
				<input id="speed" v-model="speed" type="range" min="1" max="150" step="0.5" value="50" class="slider">
			</div>

			<div class="option flex_c_h alignCenter gap1">
				<DesignIcons icon="textsize" customclass="textsize" />
				<input id="fontScale" v-model="fontScale" type="range" min="0.5" max="7" value="3.5" class="slider" step="0.1">
			</div>

			<div class="option flex_c_h alignCenter gap1">
				<DesignIcons icon="padding" customclass="sidePadding" />
				<input id="sidePadding" v-model="sidePadding" type="range" min="0.4" max="30" value="5" class="slider" step="0.1">
			</div>
		</div>
		<div v-if="tabs && tabs[1] && tabs[1].active" class="colorSetttings">
			<div class="flex_c_h gap1">
				<div class="option button" @click="openColorPicker">
					<DesignIcons icon="textcolor" customclass="textcolor" />
					<input id="colorPicker" ref="colorPicker" v-model="colorText" type="color" class="color-picker">
				</div>

				<div class="option button " @click="openColorFillPicker">
					<DesignIcons icon="fillcolor" customclass="fillcolor" />
					<input id="colorFillPicker" ref="colorFillPicker" v-model="colorBackground" type="color" class="color-fillpicker">
				</div>

				<div class="option button " @click="openColorThemePicker">
					<DesignIcons icon="themecolor" customclass="themecolor" />
					<input id="colorThemePicker" ref="colorThemePicker" v-model="colorTheme" type="color" class="color-themepicker">
				</div>
			</div>
		</div>

		<div v-if="tabs && tabs[2] && tabs[2].active" class="controlSetttings">
			<p>Coming Soon</p>
		</div>
	</div>
</template>

<script lang="ts" setup>
	import { useStore } from "@/stores/store";
	import { onKeyStroke, useMouse, useMouseInElement, useMousePressed } from "@vueuse/core";

	interface KeyboardControl {
		keyStroke: string
		action: string
	}

	const { pressed } = useMousePressed();
	const { sourceType } = useMouse();

	const SettingsBar = ref(null);

	const store = useStore();
	const colorText = ref(store.settings.colorText);
	const colorBackground = ref(store.settings.colorBackground);
	const colorTheme = ref(store.settings.colorTheme);
	const fontScale = ref(store.settings.fontScale);
	const sidePadding = ref(store.settings.sidePadding);
	const tabs = computed(() => store.settings.tabs || []);
	const mouseOverSettingsButton = computed(() => store.settings.mouseOverSettingsButton);
	const keyboardControls: ComputedRef<KeyboardControl[]> = computed(() => store.settings.keyboardControls || []);
	const websocketServer = ref(store.settings.websocketServer);

	const { isOutside } = useMouseInElement(SettingsBar);
	const { isMobile } = useDevice();

	function checkAllKeystrokes(keyboardControlsValue: KeyboardControl[]) {
		const allKeys: { keyStroke: string, index: number }[] = [];

		// Make sure keyboardControlsValue is an array
		if (!Array.isArray(keyboardControlsValue)) {
			return allKeys;
		}

		// Use forEach which is safer than for loop with indices
		keyboardControlsValue.forEach((control, index) => {
			if (control && typeof control === "object" && "keyStroke" in control && control.keyStroke) {
				allKeys.push({ keyStroke: control.keyStroke, index });
			}
		});

		return allKeys;
	}
	onKeyStroke(checkAllKeystrokes(keyboardControls.value).map((k) => k.keyStroke), (e) => {
		const keyObject = checkAllKeystrokes(keyboardControls.value).find((k) => k.keyStroke === e.key);
		if (keyObject) {
			const index = keyObject.index;
			store.setShortcutAction(index);
			console.log(`Key: ${e.key}, Index: ${index}`);
		}
	});

	watch(pressed, () => {
		if (isOutside.value && pressed.value === true && store.settings.open === true && mouseOverSettingsButton.value === false && !isMobile) {
			console.log(sourceType.value, isMobile);
			store.setOverlaysClosed();
		}
	});

	watch(colorText, (newColor) => {
		store.settings.colorText = newColor;
		document.documentElement.style.setProperty("--text_color", newColor);
	});

	watch(websocketServer, (newWebsocketServer) => {
		store.settings.websocketServer = newWebsocketServer;
	});

	watch(colorBackground, () => {
		store.settings.colorBackground = getColorFillPickerRGB() || "";

		document.documentElement.style.setProperty("--prompt_bg", getColorFillPickerRGB() || "");
	});

	watch(colorTheme, (newColor) => {
		store.settings.colorTheme = newColor;

		document.documentElement.style.setProperty("--color_p", newColor);
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

	onMounted(() => {
		document.documentElement.style.setProperty("--text_color", colorText.value);
		document.documentElement.style.setProperty("--prompt_bg", colorBackground.value);
		document.documentElement.style.setProperty("--fontSize", `${fontScale.value}`);
		document.documentElement.style.setProperty("--sidePadding", `${sidePadding.value}rem`);
	});

	const colorPicker = ref<HTMLInputElement | null>(null);
	const colorFillPicker = ref<HTMLInputElement | null>(null);
	const colorThemePicker = ref<HTMLInputElement | null>(null);

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

	function openColorThemePicker() {
		const colorThemePickerElement = colorThemePicker.value;
		if (colorThemePickerElement) {
			colorThemePickerElement.click();
		}
	}

	function getColorFillPickerRGB() {
		const colorFillPickerElement = colorFillPicker.value;
		if (colorFillPickerElement) {
			const color = colorFillPickerElement.value;
			const rgb = hexToRgb(color);
			return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
		}
	}

	function hexToRgb(hex: string) {
		const bigint = Number.parseInt(hex.slice(1), 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;
		return { r, g, b };
	}

	function setActiveTab(index: number) {
		tabs.value.forEach((tab, i) => {
			tab.active = i === index;
		});
	}
</script>

<style>

</style>
