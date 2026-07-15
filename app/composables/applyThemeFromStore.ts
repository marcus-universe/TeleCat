import type { useStore } from "@/stores/store";

type Store = ReturnType<typeof useStore>;

function hexToRgbString(hex: string): string | null {
	if (!hex.startsWith("#")) return null;
	const bigint = Number.parseInt(hex.slice(1), 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return `${r}, ${g}, ${b}`;
}

function resolveBackground(colorBackground: string): string {
	if (colorBackground.includes(",")) return colorBackground;
	if (colorBackground.startsWith("#")) {
		return hexToRgbString(colorBackground) ?? colorBackground;
	}
	return colorBackground;
}

export function applyThemeFromStore(store: Store) {
	if (!import.meta.client) return;

	const s = store.settings;

	document.documentElement.style.setProperty("--mirrorX", s.mirroredX ? "-1" : "1");
	document.documentElement.style.setProperty("--mirrorY", s.mirroredY ? "-1" : "1");
	document.documentElement.style.setProperty("--fontSize", `${s.fontScale}`);
	document.documentElement.style.setProperty("--sidePadding", `${s.sidePadding}rem`);
	document.documentElement.style.setProperty("--h1Scale", `${s.h1Scale}rem`);
	document.documentElement.style.setProperty("--h2Scale", `${s.h2Scale}rem`);
	document.documentElement.style.setProperty("--h3Scale", `${s.h3Scale}rem`);
	document.documentElement.style.setProperty("--pScale", `${s.pSize}rem`);
	document.documentElement.style.setProperty("--pLineHeight", `${s.pLineHeight}`);
	document.documentElement.style.setProperty("--pSpacing", `${s.pSpacing}`);
	document.documentElement.style.setProperty("--text_color", s.colorText);
	document.documentElement.style.setProperty("--prompt_bg", resolveBackground(s.colorBackground));
	document.documentElement.style.setProperty("--color_p", s.colorTheme);
	document.documentElement.style.setProperty("--highlight_color", s.colorHighlight ?? "#fff59e");
}
