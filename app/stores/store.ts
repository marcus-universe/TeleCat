import { acceptHMRUpdate, defineStore } from "pinia";

export const useStore = defineStore("store", {
	state: () => {
		return {
			previewState: true,
			playState: false,
			fullscreen: false,
			speed: 80,
			textContent: `<h1>Nya to <mark>TeleCat</mark>!</h1><p> This is the best <strong>Open Source Teleprompter App</strong> for you and your cat.</p><p> <img src=\"https://media.tenor.com/E3v4j9VZuSwAAAAj/cute-cat-cat-typing.gif\" alt=\"a cartoon cat is sitting on a keyboard with a speech bubble above its head\" width=\"256\" height=\"192\" style=\"max-width: 100%; height: auto; margin: 0.25rem; display: inline-block; vertical-align: middle;\"></p><h2>First Steps</h2><ul><li><p>On the top right corner you can switch between preview and edit mode.</p></li><li><p>Inside the Settings you can customize the appearance and behavior of the teleprompter.</p></li><li><p>Change the scroll direction with the two arrows next to the play button.</p></li><li><p>Inside the edit view you can use markdown syntax to style your promter content.</p></li></ul><p>Consider contributing to the <strong>Open Source Community</strong> to support this project at:<br><a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"https://github.com/marcus-universe/TeleCat\">github.com/marcus-universe/TeleCat</a>❤️</p>`,
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
				colorBackground: "27, 31, 58",
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
				sidePadding: this.settings.sidePadding
			};
		},

		importSettings(data: any) {
			if (!data || typeof data !== "object") return;

			if (data.speed !== undefined) this.speed = data.speed;
			if (data.textContent !== undefined) this.textContent = data.textContent;

			if (data.mirroredX !== undefined) this.settings.mirroredX = data.mirroredX;
			if (data.mirroredY !== undefined) this.settings.mirroredY = data.mirroredY;

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
		}
	}
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot));
}
