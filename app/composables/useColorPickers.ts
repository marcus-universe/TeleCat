export function useColorPickers() {
	const store = useStore();
	const colorPicker = ref<HTMLInputElement | null>(null);
	const colorFillPicker = ref<HTMLInputElement | null>(null);
	const colorThemePicker = ref<HTMLInputElement | null>(null);
	const colorText = ref(store.settings.colorText);
	const colorBackground = ref(store.settings.colorBackground);
	const colorTheme = ref(store.settings.colorTheme);

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
	});

	return {
		colorPicker,
		colorFillPicker,
		colorThemePicker,
		openColorPicker,
		openColorFillPicker,
		openColorThemePicker,
		getColorFillPickerRGB,
		colorText,
		colorBackground,
		colorTheme
	};
}
