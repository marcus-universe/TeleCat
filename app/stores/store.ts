import { acceptHMRUpdate, defineStore } from "pinia";

export const useStore = defineStore("store", {
	state: () => {
		return {
			previewState: true,
			playState: false,
			fullscreen: false,
			speed: 100,
			textContent: `# Nya 😺 to TeleCat!
This is the best **Open Source Telepromter App** for you and your cat 😺

## First Steps
<ul>
  <li>On the top right corner you can switch between preview and edit mode.</li>
  <li>On the top left corner you find Settings to customize the preview look.</li>
  <li>Change the scroll direction with the two arrows next to the play button</li>
  <li>Inside the edit view you can use markdown syntax to style your promter content</li>
</ul>

> Consider contributing to the **Open Source Community** to support this project ❤️`,
			settings: {
				open: false,
				mouseOverSettings: false,
				mouseOverSettingsButton: false,
				mouseSourceType: "mouse",
				websocketServer: { active: false, port: 6969, host: "192.168.50.78" },

				tabs: [
					{ name: "General", active: true },
					{ name: "Colors", active: false },
					{ name: "Controls", active: false }
				],
				mirroredX: false,
				mirroredY: false,
				colorText: "#eeeeee",
				colorTheme: "#FF8548",
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
					{ keyStroke: "ArrowLeft", action: "decreaseSpeed" },
					{ keyStroke: "ArrowRight", action: "increaseSpeed" }
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
			this.speed = newSpeed;
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
		toggleWebsocketServer() {
			this.settings.websocketServer.active = !this.settings.websocketServer.active;
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
