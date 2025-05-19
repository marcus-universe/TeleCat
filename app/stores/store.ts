import { acceptHMRUpdate, defineStore } from "pinia";

export const useStore = defineStore("store", {
	state: () => {
		return {
			previewState: true,
			playState: false,
			fullscreen: false,
			speed: 100,
			textContent: `<h1> Nya 😺 to TeleCat! </h1>
This is the best <b>Open Source Telepromter App</b> for you and your cat 😺

<h2> First Steps </h2>
<ul>
  <li>On the top right corner you can switch between preview and edit mode.</li>
  <li>On the top left corner you find Settings to customize the preview look.</li>
  <li>Change the scroll direction with the two arrows next to the play button</li>
  <li>Inside the edit view you can use markdown syntax to style your promter content</li>
</ul>

Consider contributing to the <b>Open Source Community</b> to support this project ❤️`,
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
					{ name: "Colors", active: false },
					{ name: "Controls", active: false }
				],
				mirroredX: false,
				mirroredY: false,
				colorText: "#eeeeee",
				colorTheme: "#5E43FF",
				colorBackground: "27, 31, 58",
				direction: true,
				fontScale: 3.5,
				editFontScale: 1.5,
				sidePadding: 8,
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
			this.settings.open = !this.settings.open;
		},
		setOverlaysClosed() {
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
		}
	}
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot));
}
