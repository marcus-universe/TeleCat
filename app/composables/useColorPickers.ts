export function useColorPickers() {
	const store = useStore();
	const colorPicker = ref<HTMLInputElement | null>(null);
	const colorFillPicker = ref<HTMLInputElement | null>(null);
	const colorThemePicker = ref<HTMLInputElement | null>(null);
	const colorHighlightPicker = ref<HTMLInputElement | null>(null);
	const colorText = ref(store.settings.colorText);
	const colorBackground = ref(store.settings.colorBackground);
	const colorTheme = ref(store.settings.colorTheme);
	const colorHighlight = ref(store.settings.colorHighlight ?? "#fff59e");

	// Watchers
	watch(colorText, (newColor) => {
		store.settings.colorText = newColor;
		document.documentElement.style.setProperty("--text_color", newColor);
	});

	watch(colorBackground, () => {
		store.settings.colorBackground = getColorFillPickerRGB() || "";
		document.documentElement.style.setProperty("--prompt_bg", getColorFillPickerRGB() || "");
	});

	watch(colorTheme, (newColor) => {
		store.settings.colorTheme = newColor;
		document.documentElement.style.setProperty("--color_p", newColor);
	});

	watch(colorHighlight, (newColor) => {
		store.settings.colorHighlight = newColor;
		document.documentElement.style.setProperty("--highlight_color", newColor);
	});

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

	function openColorHighlightPicker() {
		const el = colorHighlightPicker.value;
		if (el) {
			el.click();
		}
	}

	function getColorFillPickerRGB() {
		const colorFillPickerElement = colorFillPicker.value;
		if (colorFillPickerElement) {
			const color = colorFillPickerElement.value;
			const rgb = hexToRgb(color);
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
		document.documentElement.style.setProperty("--text_color", colorText.value);
		document.documentElement.style.setProperty("--prompt_bg", getColorFillPickerRGB() || "");
		document.documentElement.style.setProperty("--color_p", colorTheme.value);
		document.documentElement.style.setProperty("--highlight_color", colorHighlight.value);
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
