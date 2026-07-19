import { computed, onMounted, watch } from "vue";
import { applyThemeFromStore } from "@/composables/applyThemeFromStore";

export function useSettings() {
	const store = useStore();

	const fontScale = computed({
		get: () => store.settings.fontScale,
		set: (v: number) => (store.settings.fontScale = v)
	});

	const sidePadding = computed({
		get: () => store.settings.sidePadding,
		set: (v: number) => (store.settings.sidePadding = v)
	});

	const h1Scale = computed({ get: () => store.settings.h1Scale, set: (v: number) => (store.settings.h1Scale = v) });
	const h2Scale = computed({ get: () => store.settings.h2Scale, set: (v: number) => (store.settings.h2Scale = v) });
	const h3Scale = computed({ get: () => store.settings.h3Scale, set: (v: number) => (store.settings.h3Scale = v) });

	const pSize = computed({ get: () => store.settings.pSize, set: (v: number) => (store.settings.pSize = v) });
	const pLineHeight = computed({ get: () => store.settings.pLineHeight, set: (v: number) => (store.settings.pLineHeight = v) });
	const pSpacing = computed({ get: () => store.settings.pSpacing ?? 1, set: (v: number) => (store.settings.pSpacing = v) });

	const tabs = computed(() => store.settings.tabs || []);
	const websocketServer = computed({ get: () => store.settings.websocketServer, set: (v: any) => (store.settings.websocketServer = v) });

	const mirrorX = computed({ get: () => store.settings.mirroredX, set: (v: boolean) => (store.settings.mirroredX = v) });
	const mirrorY = computed({ get: () => store.settings.mirroredY, set: (v: boolean) => (store.settings.mirroredY = v) });

	const speed = computed({ get: () => store.speed, set: (v: number) => (store.speed = v) });

	watch(
		() => store.settings,
		() => applyThemeFromStore(store),
		{ deep: true, immediate: true }
	);

	watch(
		() => store.speed,
		() => applyThemeFromStore(store)
	);

	onMounted(() => {
		applyThemeFromStore(store);
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
