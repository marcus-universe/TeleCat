<template>
	<div class="control-settings-panel">
		<h2>{{ t("control.clientStyling") }}</h2>
		<p class="control-settings-hint">{{ t("control.mirrorOverrideHint") }}</p>

		<ul class="settingsTabs flex_c_h">
			<li
				v-for="(tab, index) in tabs"
				:key="tab.id"
				class="settingTab"
				:class="{ active: activeTab === index }"
				@click="activeTab = index"
			>
				{{ tab.label }}
			</li>
		</ul>

		<div v-if="activeTab === 0" class="generalSettings">
			<div class="flex_c_h gap1">
				<div class="option button flex_c_h" :class="{ active: model.mirroredX }" @click="toggleMirrorX">
					<DesignIcons icon="mirror" customclass="mirrorX" />
				</div>
				<div class="option button" :class="{ active: model.mirroredY }" @click="toggleMirrorY">
					<DesignIcons icon="mirror" customclass="mirrorY" />
				</div>
			</div>

			<SettingsSlider id="ctrlSpeed" v-model:model-value="model.speed" :min="1" :max="150" :step="0.5">
				<template #prefix>
					<DesignIcons icon="speed" customclass="speed" />
				</template>
			</SettingsSlider>

			<SettingsSlider id="ctrlFontScale" v-model:model-value="model.fontScale" :min="0.5" :max="7" :step="0.1">
				<template #prefix>
					<DesignIcons icon="textsize" customclass="textsize" />
				</template>
			</SettingsSlider>

			<SettingsSlider id="ctrlSidePadding" v-model:model-value="model.sidePadding" :min="0.4" :max="50" :step="0.1">
				<template #prefix>
					<DesignIcons icon="padding" customclass="sidePadding" />
				</template>
			</SettingsSlider>
		</div>

		<div v-if="activeTab === 1" class="stylingSettings">
			<div class="flex_c_h gap1">
				<div class="option button" @click="colorTextRef?.click()">
					<DesignIcons icon="textcolor" customclass="textcolor" />
					<input ref="colorTextRef" v-model="model.colorText" type="color" class="color-picker">
				</div>
				<div class="option button" @click="colorFillRef?.click()">
					<DesignIcons icon="fillcolor" customclass="fillcolor" />
					<input ref="colorFillRef" v-model="colorBackgroundHex" type="color" class="color-fillpicker">
				</div>
				<div class="option button" @click="colorThemeRef?.click()">
					<DesignIcons icon="themecolor" customclass="themecolor" />
					<input ref="colorThemeRef" v-model="model.colorTheme" type="color" class="color-themepicker">
				</div>
				<div class="option button" @click="colorHighlightRef?.click()">
					<DesignIcons icon="mark" customclass="icon" />
					<input ref="colorHighlightRef" v-model="model.colorHighlight" type="color" class="color-highlightpicker">
				</div>
			</div>

			<SettingsSlider id="ctrlH1" v-model:model-value="model.h1Scale" label="H1 Scale" :min="1" :max="10" :step="0.1" />
			<SettingsSlider id="ctrlH2" v-model:model-value="model.h2Scale" label="H2 Scale" :min="1" :max="10" :step="0.1" />
			<SettingsSlider id="ctrlH3" v-model:model-value="model.h3Scale" label="H3 Scale" :min="1" :max="10" :step="0.1" />
			<SettingsSlider id="ctrlPSize" v-model:model-value="model.pSize" label="P Scale" :min="0.5" :max="10" :step="0.1" />
			<SettingsSlider id="ctrlPSpacing" v-model:model-value="model.pSpacing" label="P Spacing" :min="0" :max="3" :step="0.05" />
			<SettingsSlider id="ctrlPLineHeight" v-model:model-value="model.pLineHeight" label="Line Height" :min="0.3" :max="3" :step="0.05" />
		</div>
	</div>
</template>

<script lang="ts" setup>
	import SettingsSlider from "~/components/Layout/SettingsSlider.vue";

	export interface ClientStyleModel {
		speed: number;
		fontScale: number;
		sidePadding: number;
		mirroredX: boolean;
		mirroredY: boolean;
		colorText: string;
		colorBackground: string;
		colorTheme: string;
		colorHighlight: string;
		h1Scale: number;
		h2Scale: number;
		h3Scale: number;
		pSize: number;
		pSpacing: number;
		pLineHeight: number;
	}

	const model = defineModel<ClientStyleModel>({ required: true });

	const { t } = useI18n();
	const activeTab = ref(0);

	const tabs = computed(() => [
		{ id: "general", label: t("control.tabs.general") },
		{ id: "styling", label: t("control.tabs.styling") }
	]);

	const colorTextRef = ref<HTMLInputElement | null>(null);
	const colorFillRef = ref<HTMLInputElement | null>(null);
	const colorThemeRef = ref<HTMLInputElement | null>(null);
	const colorHighlightRef = ref<HTMLInputElement | null>(null);

	function hexToRgbString(hex: string): string {
		const bigint = Number.parseInt(hex.slice(1), 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;
		return `${r}, ${g}, ${b}`;
	}

	function rgbStringToHex(rgb: string): string {
		if (rgb.startsWith("#")) return rgb;
		const parts = rgb.split(",").map(s => Number.parseInt(s.trim(), 10));
		if (parts.length !== 3) return "#000000";
		return `#${parts.map(n => n.toString(16).padStart(2, "0")).join("")}`;
	}

	const colorBackgroundHex = computed({
		get: () => rgbStringToHex(model.value.colorBackground),
		set: (hex: string) => {
			model.value = { ...model.value, colorBackground: hexToRgbString(hex) };
		}
	});

	function toggleMirrorX() {
		model.value = { ...model.value, mirroredX: !model.value.mirroredX };
	}

	function toggleMirrorY() {
		model.value = { ...model.value, mirroredY: !model.value.mirroredY };
	}
</script>
