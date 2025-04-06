import { computed, onMounted, ref, watch } from "vue";

export function useSettings() {
	const store = useStore();
	const fontScale = ref(store.settings.fontScale);
	const sidePadding = ref(store.settings.sidePadding);
	const tabs = computed(() => store.settings.tabs || []);
	const websocketServer = ref(store.settings.websocketServer);
	const mirrorX = computed(() => store.settings.mirroredX);
	const mirrorY = computed(() => store.settings.mirroredY);
	const speed = ref(store.speed);

	watch(mirrorX, (newMirrorX) => {
		store.settings.mirroredX = newMirrorX;
		document.documentElement.style.setProperty(
			"--mirrorX",
			newMirrorX ? "-1" : "1"
		);
	});

	watch(mirrorY, (newMirrorY) => {
		store.settings.mirroredY = newMirrorY;
		document.documentElement.style.setProperty(
			"--mirrorY",
			newMirrorY ? "-1" : "1"
		);
	});

	watch(fontScale, (newFontScale) => {
		store.settings.fontScale = newFontScale;
		document.documentElement.style.setProperty("--fontSize", `${newFontScale}`);
	});

	watch(sidePadding, (newSidePadding) => {
		store.settings.sidePadding = newSidePadding;
		document.documentElement.style.setProperty(
			"--sidePadding",
			`${newSidePadding}rem`
		);
	});

	watch(speed, (newSpeed) => {
		store.speed = newSpeed;
	});

	// Watch for changes in the store and update the speed ref
	watch(
		() => store.speed,
		(newSpeed) => {
			speed.value = newSpeed; // Sync the ref with the store
			console.log(`Speed ref synced with store: ${newSpeed}`);
		}
	);

	onMounted(() => {
		document.documentElement.style.setProperty(
			"--fontSize",
			`${fontScale.value}`
		);
		document.documentElement.style.setProperty(
			"--sidePadding",
			`${sidePadding.value}rem`
		);
	});

	return {
		fontScale,
		sidePadding,
		tabs,
		websocketServer,
		mirrorX,
		mirrorY,
		speed,
		store
	};
}
