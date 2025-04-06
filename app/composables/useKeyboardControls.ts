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
			const keyObject = checkAllKeystrokes(keyboardControls.value).find(
				(k) => k.keyStroke === e.key
			);
			if (keyObject) {
				const index = keyObject.index;
				store.setShortcutAction(index);
				return `Key: ${e.key}, Index: ${index}`;
			}
		}
	);

	return {
		keyboardControls,
		checkAllKeystrokes
	};
}
