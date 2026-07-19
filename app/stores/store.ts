import { acceptHMRUpdate, defineStore } from "pinia";
import { applyThemeFromStore } from "@/composables/applyThemeFromStore";
import { persistClientOverrides } from "@/composables/useClientStylePersistence";
import { useNetworkStore } from "@/stores/network";
import { DEFAULT_TEXT_CONTENT, getDefaultProjectData } from "../../shared/defaultProjectData";

export { DEFAULT_TEXT_CONTENT, getDefaultProjectData };

export const useStore = defineStore("store", {
	state: () => {
		return {
			previewState: true,
			playState: false,
			fullscreen: false,
			isClientMode: false,
			clientOverrides: null as Record<string, unknown> | null,
			speed: 80,
			textContent: DEFAULT_TEXT_CONTENT,
			settings: {
				open: false,
				mouseOverSettings: false,
				mouseOverSettingsButton: false,
				mouseSourceType: "mouse",
				serverList: [] as string[],
				IPBase: "192.168.1.",
				websocketServer: {
					active: false,
					connected: false,
					host: "192.168.20.100:6969"
				},
				tabs: [
					{ name: "General", active: true },
					{ name: "Styling", active: false },
					{ name: "Controls", active: false }
				],
				mirroredX: false,
				mirroredY: false,
				colorText: "#eeeeee",
				colorTheme: "#eeeeee",
				colorBackground: "0, 0, 0",
				colorHighlight: "#6038FF",
				direction: true,
				fontScale: 3,
				h1Scale: 4.5,
				h2Scale: 3.5,
				h3Scale: 2.5,
				pSize: 1.5,
				pLineHeight: 1.5,
				pSpacing: 1,
				editFontScale: 1.5,
				sidePadding: 6.4,
				keyboardControls: [
					{ keyStroke: "Enter", action: "ChangeScrollDirection" },
					{ keyStroke: " ", action: "Play/Pause" },
					{ keyStroke: "Tab", action: "Preview/Editor" },
					{ keyStroke: "F11", action: "fullscreen" },
					{ keyStroke: "PageDown", action: "decreaseSpeed" },
					{ keyStroke: "PageUp", action: "increaseSpeed" }
				]
			}
		};
	},
	getters: {
		// getter
	},
	actions: {
		switchPreviewState() {
			this.previewState = !this.previewState;
		},
		togglePlayState() {
			this.playState = !this.playState;
		},
		setSpeed(newSpeed: number) {
			this.speed = Math.min(Math.max(Math.round(newSpeed), 1), 150);
		},
		setSettingsOpen() {
			this.settings.open = true;
		},
		setSettingsClosed() {
			this.settings.open = false;
		},

		toggleDirection() {
			this.settings.direction = !this.settings.direction;
		},
		toggleMirroredX() {
			this.settings.mirroredX = !this.settings.mirroredX;
		},
		toggleMirroredY() {
			this.settings.mirroredY = !this.settings.mirroredY;
		},
		toggleFullscreen() {
			this.fullscreen = !this.fullscreen;
		},
		setMouseSettingsButtonOver(value: boolean) {
			this.settings.mouseOverSettingsButton = value;
		},
		setServerList(servers: string[]) {
			this.settings.serverList = servers;
		},
		setWebsocketConnected(value: boolean) {
			this.settings.websocketServer.connected = value;
		},
		toggleWebsocketServer() {
			this.settings.websocketServer.active
				= !this.settings.websocketServer.active;
		},
		setShortcutAction(index: number) {
			if (this.previewState) {
				if (index === 0) {
					this.toggleDirection();
				} else if (index === 1) {
					this.togglePlayState();
				} else if (index === 2) {
					this.switchPreviewState();
				} else if (index === 3) {
					this.toggleFullscreen();
				} else if (index === 4) {
					this.setSpeed(this.speed - 10);
				} else if (index === 5) {
					this.setSpeed(this.speed + 10);
				}
			} else {
				if (index === 2) {
					this.switchPreviewState();
				}
			}
		},
		exportSettings() {
			return {
				speed: this.speed,
				textContent: this.textContent,
				mirroredX: this.settings.mirroredX,
				mirroredY: this.settings.mirroredY,
				colorText: this.settings.colorText,
				colorTheme: this.settings.colorTheme,
				colorBackground: this.settings.colorBackground,
				colorHighlight: this.settings.colorHighlight,
				fontScale: this.settings.fontScale,
				h1Scale: this.settings.h1Scale,
				h2Scale: this.settings.h2Scale,
				h3Scale: this.settings.h3Scale,
				pSize: this.settings.pSize,
				pLineHeight: this.settings.pLineHeight,
				pSpacing: this.settings.pSpacing,
				sidePadding: this.settings.sidePadding,
				direction: this.settings.direction
			};
		},

		applyClientOverrides(payload: Record<string, unknown>) {
			this.clientOverrides = { ...(this.clientOverrides ?? {}), ...payload };
			this.applyOverrideValues(payload);
			applyThemeFromStore(this);

			if (import.meta.client && this.isClientMode) {
				const network = useNetworkStore();
				if (network.projectId && network.instanceId) {
					persistClientOverrides(network.projectId, network.instanceId, this.clientOverrides);
				}
			}
		},

		applyOverrideValues(data: Record<string, unknown>) {
			if (data.speed !== undefined) this.speed = data.speed as number;
			if (data.mirroredX !== undefined) this.settings.mirroredX = data.mirroredX as boolean;
			if (data.mirroredY !== undefined) this.settings.mirroredY = data.mirroredY as boolean;
			if (data.colorText !== undefined) this.settings.colorText = data.colorText as string;
			if (data.colorTheme !== undefined) this.settings.colorTheme = data.colorTheme as string;
			if (data.colorBackground !== undefined) this.settings.colorBackground = data.colorBackground as string;
			if (data.colorHighlight !== undefined) this.settings.colorHighlight = data.colorHighlight as string;
			if (data.fontScale !== undefined) this.settings.fontScale = data.fontScale as number;
			if (data.h1Scale !== undefined) this.settings.h1Scale = data.h1Scale as number;
			if (data.h2Scale !== undefined) this.settings.h2Scale = data.h2Scale as number;
			if (data.h3Scale !== undefined) this.settings.h3Scale = data.h3Scale as number;
			if (data.pSize !== undefined) this.settings.pSize = data.pSize as number;
			if (data.pLineHeight !== undefined) this.settings.pLineHeight = data.pLineHeight as number;
			if (data.pSpacing !== undefined) this.settings.pSpacing = data.pSpacing as number;
			if (data.sidePadding !== undefined) this.settings.sidePadding = data.sidePadding as number;
		},

		importSettings(data: any, options?: { syncPlayback?: boolean; applyMirror?: boolean }) {
			if (!data || typeof data !== "object") return;

			if (data.speed !== undefined) this.speed = data.speed;
			if (data.textContent !== undefined) this.textContent = data.textContent;

			if (options?.applyMirror !== false) {
				if (data.mirroredX !== undefined) this.settings.mirroredX = data.mirroredX;
				if (data.mirroredY !== undefined) this.settings.mirroredY = data.mirroredY;
			}

			if (data.colorText !== undefined) this.settings.colorText = data.colorText;
			if (data.colorTheme !== undefined) this.settings.colorTheme = data.colorTheme;
			if (data.colorBackground !== undefined) this.settings.colorBackground = data.colorBackground;
			if (data.colorHighlight !== undefined) this.settings.colorHighlight = data.colorHighlight;

			if (data.fontScale !== undefined) this.settings.fontScale = data.fontScale;
			if (data.h1Scale !== undefined) this.settings.h1Scale = data.h1Scale;
			if (data.h2Scale !== undefined) this.settings.h2Scale = data.h2Scale;
			if (data.h3Scale !== undefined) this.settings.h3Scale = data.h3Scale;

			if (data.pSize !== undefined) this.settings.pSize = data.pSize;
			if (data.pLineHeight !== undefined) this.settings.pLineHeight = data.pLineHeight;
			if (data.pSpacing !== undefined) this.settings.pSpacing = data.pSpacing;
			if (data.sidePadding !== undefined) this.settings.sidePadding = data.sidePadding;

			if (data.direction !== undefined) this.settings.direction = data.direction;

			if (options?.syncPlayback) {
				if (data.playState !== undefined) this.playState = data.playState;
				if (data.previewState !== undefined) this.previewState = data.previewState;
				if (data.scrollY !== undefined && import.meta.client) {
					window.scrollTo({ top: data.scrollY as number, behavior: "instant" as ScrollBehavior });
				}
			}

			if (this.isClientMode && this.clientOverrides) {
				this.applyOverrideValues(this.clientOverrides);
			}

			applyThemeFromStore(this);
		},

		setClientMode(value: boolean) {
			this.isClientMode = value;
			if (value) {
				this.previewState = true;
			} else {
				this.clientOverrides = null;
			}
		},

		applyDefaultProjectData() {
			this.importSettings(getDefaultProjectData());
			this.previewState = true;
			this.playState = false;
		}
	}
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot));
}
