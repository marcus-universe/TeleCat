import { computed, onMounted, ref, watch } from "vue";
import { applyThemeFromStore } from "@/composables/applyThemeFromStore";
import { useStore } from "../stores/store.js";

export function useColorPickers() {
	const store = useStore();
	const colorPicker = ref<HTMLInputElement | null>(null);
	const colorFillPicker = ref<HTMLInputElement | null>(null);
	const colorThemePicker = ref<HTMLInputElement | null>(null);
	const colorHighlightPicker = ref<HTMLInputElement | null>(null);

	const colorText = computed({
		get: () => store.settings.colorText,
		set: (v: string) => (store.settings.colorText = v)
	});
	const colorBackground = computed({
		get: () => store.settings.colorBackground,
		set: (v: string) => (store.settings.colorBackground = v)
	});
	const colorTheme = computed({
		get: () => store.settings.colorTheme,
		set: (v: string) => (store.settings.colorTheme = v)
	});
	const colorHighlight = computed({
		get: () => store.settings.colorHighlight ?? "#fff59e",
		set: (v: string) => (store.settings.colorHighlight = v)
	});

	watch(
		() => [store.settings.colorText, store.settings.colorBackground, store.settings.colorTheme, store.settings.colorHighlight],
		() => applyThemeFromStore(store),
		{ immediate: true }
	);

	function openColorPicker() {
		colorPicker.value?.click();
	}

	function openColorFillPicker() {
		colorFillPicker.value?.click();
	}

	function openColorThemePicker() {
		colorThemePicker.value?.click();
	}

	function openColorHighlightPicker() {
		colorHighlightPicker.value?.click();
	}

	function getColorFillPickerRGB() {
		const el = colorFillPicker.value;
		if (el) {
			const rgb = hexToRgb(el.value);
			return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
		}
		return null;
	}

	function hexToRgb(hex: string) {
		const bigint = Number.parseInt(hex.slice(1), 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;
		return { r, g, b };
	}

	onMounted(() => {
		applyThemeFromStore(store);
	});

	return {
		colorPicker,
		colorFillPicker,
		colorThemePicker,
		colorHighlightPicker,
		openColorPicker,
		openColorFillPicker,
		openColorThemePicker,
		openColorHighlightPicker,
		getColorFillPickerRGB,
		colorText,
		colorBackground,
		colorTheme,
		colorHighlight
	};
}
