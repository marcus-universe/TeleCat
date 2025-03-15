import { acceptHMRUpdate, defineStore } from "pinia";

export const useStore = defineStore("store", {
	state: () => {
		return {
			previewState: true,
			playState: false,
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
				tabs: [{ name: "General", active: true }, { name: "Colors", active: false }, { name: "Controls", active: false }],
				mirroredX: false,
				mirroredY: false,
				colorText: "#eeeeee",
				colorBackground: "27, 31, 58",
				direction: true,
				fontScale: 1.5,
				sidePadding: 8
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

		toggleDirection() {
			this.settings.direction = !this.settings.direction;
		},
		toggleMirroredX() {
			this.settings.mirroredX = !this.settings.mirroredX;
		},
		toggleMirroredY() {
			this.settings.mirroredY = !this.settings.mirroredY;
		}

	}
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot));
}
