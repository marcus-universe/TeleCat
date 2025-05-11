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
			<div class="option button flex_c_h" :class="{ active: websocketServer.active }" @click="store.toggleWebsocketServer();">
				<DesignIcons icon="serverRun" customclass="serverRun" />
			</div>

			<div v-show="websocketServer.active" class="option flex_c_h alignCenter">
				<DesignIcons icon="websocket" customclass="websocket" />
				<input id="websocketServer" v-model="websocketServer.host" type="text" class="text w100">
			</div>

			<div class="option flex_c_h alignCenter gap1">
				<DesignIcons icon="speed" customclass="speed" />
				<input id="speed" v-model="speed" type="range" min="1" max="150" step="0.5" value="50" class="slider w100">
				<input id="speedValue" v-model="speed" type="number" class="number">
			</div>

			<div class="option flex_c_h alignCenter gap1">
				<DesignIcons icon="textsize" customclass="textsize" />
				<input id="fontScale" v-model="fontScale" type="range" min="0.5" max="7" value="3.5" class="slider w100" step="0.1">
				<input id="fontScaleValue" v-model="fontScale" type="number" class="number">
			</div>

			<div class="option flex_c_h alignCenter gap1">
				<DesignIcons icon="padding" customclass="sidePadding" />
				<input id="sidePadding" v-model="sidePadding" type="range" min="0.4" max="30" value="5" class="slider w100" step="0.1">
			</div>
		</div>
		<div v-if="tabs && tabs[1] && tabs[1].active" class="colorSetttings">
			<div class="flex_c_h gap1">
				<div class="option button" @click="openColorPicker">
					<DesignIcons icon="textcolor" customclass="textcolor" />
					<input id="colorPicker" ref="colorPicker" v-model="colorText" type="color" class="color-picker">
				</div>

				<div class="option button" @click="openColorFillPicker">
					<DesignIcons icon="fillcolor" customclass="fillcolor" />
					<input id="colorFillPicker" ref="colorFillPicker" v-model="colorBackground" type="color" class="color-fillpicker">
				</div>

				<div class="option button" @click="openColorThemePicker">
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
	import { useColorPickers } from "~/composables/useColorPickers"; // Ensure this path is correct
	import { useKeyboardControls } from "~/composables/useKeyboardControls";
	import { useSettings } from "~/composables/useSettings";

	const SettingsBar = ref(null);

	const {
		store,
		fontScale,
		sidePadding,
		tabs,
		websocketServer,
		mirrorX,
		mirrorY,
		speed
	} = useSettings();

	const { keyboardControls: _keyboardControls, checkAllKeystrokes: _checkAllKeystrokes } = useKeyboardControls();

	const {
		colorPicker,
		colorFillPicker,
		colorThemePicker,
		openColorPicker,
		openColorFillPicker,
		openColorThemePicker,
		colorText,
		colorBackground,
		colorTheme
	} = useColorPickers();

	const mouseOverSettingsButton = computed(() => store.settings.mouseOverSettingsButton);

	// Click Outside to close the settings bar
	onClickOutside(SettingsBar, () => {
		store.setOverlaysClosed();
	});

	console.log(mouseOverSettingsButton.value);

	function setActiveTab(index: number) {
		tabs.value.forEach((tab: { active: boolean }, i: number) => {
			tab.active = i === index;
		});
	}
</script>

<style>

</style>
