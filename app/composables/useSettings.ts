import { computed, onMounted, ref, watch } from "vue";

export function useSettings() {
	const store = useStore();
	const fontScale = ref(store.settings.fontScale);
	const sidePadding = ref(store.settings.sidePadding);
	const h1Scale = ref(store.settings.h1Scale);
	const h2Scale = ref(store.settings.h2Scale);
	const h3Scale = ref(store.settings.h3Scale);
	const pSize = ref(store.settings.pSize);
	const pLineHeight = ref(store.settings.pLineHeight);
	const pSpacing = ref(store.settings.pSpacing ?? 1);
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

	// Heading scales in rem
	watch(h1Scale, (val) => {
		store.settings.h1Scale = val;
		document.documentElement.style.setProperty("--h1Scale", `${val}rem`);
	});
	watch(h2Scale, (val) => {
		store.settings.h2Scale = val;
		document.documentElement.style.setProperty("--h2Scale", `${val}rem`);
	});
	watch(h3Scale, (val) => {
		store.settings.h3Scale = val;
		document.documentElement.style.setProperty("--h3Scale", `${val}rem`);
	});

	// Paragraph scale and line-height
	watch(pSize, (val) => {
		store.settings.pSize = val;
		document.documentElement.style.setProperty("--pScale", `${val}rem`);
	});
	watch(pLineHeight, (val) => {
		store.settings.pLineHeight = val;
		document.documentElement.style.setProperty("--pLineHeight", `${val}`);
	});

	// Paragraph spacing multiplier (applies to margin-bottom of paragraphs)
	watch(pSpacing, (val) => {
		store.settings.pSpacing = val;
		document.documentElement.style.setProperty("--pSpacing", `${val}`);
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
		document.documentElement.style.setProperty("--h1Scale", `${h1Scale.value}rem`);
		document.documentElement.style.setProperty("--h2Scale", `${h2Scale.value}rem`);
		document.documentElement.style.setProperty("--h3Scale", `${h3Scale.value}rem`);
		document.documentElement.style.setProperty("--pScale", `${pSize.value}rem`);
		document.documentElement.style.setProperty("--pLineHeight", `${pLineHeight.value}`);
		document.documentElement.style.setProperty("--pSpacing", `${pSpacing.value}`);
	});

	return {
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
		pSpacing,
		store
	};
}
