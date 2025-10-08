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
			<!-- <div class="option button flex_c_h" :class="{ active: websocketServer.active }" @click="store.toggleWebsocketServer();">
				<DesignIcons icon="serverRun" customclass="serverRun" />
			</div> -->

			<div v-show="websocketServer.active" class="option flex_c_h alignCenter">
				<DesignIcons icon="websocket" customclass="websocket" />
				<input id="websocketServer" v-model="websocketServer.host" type="text" class="text w100">
			</div>

			<SettingsSlider id="speed" v-model:model-value="speed" :min="1" :max="150" :step="0.5">
				<template #prefix>
					<DesignIcons icon="speed" customclass="speed" />
				</template>
			</SettingsSlider>

			<SettingsSlider id="fontScale" v-model:model-value="fontScale" :min="0.5" :max="7" :step="0.1">
				<template #prefix>
					<DesignIcons icon="textsize" customclass="textsize" />
				</template>
			</SettingsSlider>

			<SettingsSlider id="sidePadding" v-model:model-value="sidePadding" :min="0.4" :max="50" :step="0.1">
				<template #prefix>
					<DesignIcons icon="padding" customclass="sidePadding" />
				</template>
			</SettingsSlider>
		</div>
		<div v-if="tabs && tabs[1] && tabs[1].active" class="stylingSettings">
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

				<div class="option button" @click="openColorHighlightPicker">
					<Icons icon="mark" customclass="icon" />
					<input id="colorHighlightPicker" ref="colorHighlightPicker" v-model="colorHighlight" type="color" class="color-highlightpicker">
				</div>
			</div>

			<!-- Typography sliders -->
			<SettingsSlider id="h1Scale" v-model:model-value="h1Scale" label="H1 Scale" :min="1" :max="10" :step="0.1" />

			<SettingsSlider id="h2Scale" v-model:model-value="h2Scale" label="H2 Scale" :min="1" :max="10" :step="0.1" />

			<SettingsSlider id="h3Scale" v-model:model-value="h3Scale" label="H3 Scale" :min="1" :max="10" :step="0.1" />

			<SettingsSlider id="pSize" v-model:model-value="pSize" label="P Scale" :min="0.5" :max="10" :step="0.1" />

			<SettingsSlider id="pSpacing" v-model:model-value="pSpacing" label="P Spacing" :min="0" :max="3" :step="0.05" />

			<SettingsSlider id="pLineHeight" v-model:model-value="pLineHeight" label="Line Height" :min="0.3" :max="3" :step="0.05" />
		</div>

		<div v-if="tabs && tabs[2] && tabs[2].active" class="controlSetttings">
			<p>Coming Soon</p>
		</div>
	</div>
</template>

<script lang="ts" setup>
	import Icons from "~/components/Design/Icons.vue";
	import SettingsSlider from "~/components/Layout/SettingsSlider.vue";
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
		speed,
		h1Scale,
		h2Scale,
		h3Scale,
		pSize,
		pLineHeight,
		pSpacing
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
		colorTheme,
		colorHighlightPicker,
		openColorHighlightPicker,
		colorHighlight
	} = useColorPickers();

	// const mouseOverSettingsButton = computed(() => store.settings.mouseOverSettingsButton);

	// Click Outside to close the settings bar
	// Ignore clicks coming from the settings button, so the button can toggle open/close reliably
	onClickOutside(SettingsBar, (event: Event) => {
		const target = event.target as HTMLElement | null;
		if (target && target.closest(".settingsButton")) return;
		store.setSettingsClosed();
	});

	function setActiveTab(index: number) {
		tabs.value.forEach((tab: { active: boolean }, i: number) => {
			tab.active = i === index;
		});
	}
</script>

<style>

</style>
