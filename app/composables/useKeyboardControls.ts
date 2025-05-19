import { computed } from "vue";

export function useKeyboardControls() {
	const store = useStore();
	const keyboardControls = computed(() => store.settings.keyboardControls || []);

	function checkAllKeystrokes(keyboardControlsValue: any[]) {
		const allKeys: { keyStroke: string, index: number }[] = [];

		if (!Array.isArray(keyboardControlsValue)) {
			return allKeys;
		}

		keyboardControlsValue.forEach((control, index) => {
			if (control && typeof control === "object" && "keyStroke" in control && control.keyStroke) {
				allKeys.push({ keyStroke: control.keyStroke, index });
			}
		});

		return allKeys;
	}

	onKeyStroke(
		checkAllKeystrokes(keyboardControls.value).map((k) => k.keyStroke),
		(e) => {
			// Prevent default browser behavior for all configured shortcuts nur im Preview Mode
			if (store.previewState) {
				e.preventDefault();
			}

			const keyObject = checkAllKeystrokes(keyboardControls.value).find(
				(k) => k.keyStroke === e.key
			);
			if (keyObject) {
				const index = keyObject.index;
				store.setShortcutAction(index);
				return true;
			}
		}
	);

	return {
		keyboardControls,
		checkAllKeystrokes
	};
}
